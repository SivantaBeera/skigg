(function ($) {
    'use strict';

    var skigg_FORM_SEGMENT_TRACK_EVENT_NAME = js.submit_track_event;

    function array_move(arr, old_index, new_index) {
        if (new_index >= arr.length) {
            var k = new_index - arr.length + 1;
            while (k--) {
                arr.push(undefined);
            }
        }
        arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    };

    var skigg_FORM = {
        VERSION: '0.6.2',
        ui: {},
        formData: {},
        currentIndex: -1,
        storage: undefined,
        isDefined: function (obj) {
            return typeof obj !== "undefined";
        },
        isFunction: function (o) {
            return this.isDefined(o) && (typeof o === "function");
        },
        isEmptyObject: function (o) {
            return Object.keys(o).length === 0;
        },
        make: function (container, options) {
            var self = this;
            this.$container = $("#" + container);
            this.options = $.extend({}, {steps: [], blackList: [], numverify_apikey: '', urlFields: ['utm_campaign', 'utm_medium', 'utm_offer', 'utm_source'], debug: false, tmpl_path: '', maxControlFont: 87}, options || {})
            if (this.options.blackList.length) {
                this.options.blackList = this.options.blackList.map(Function.prototype.call, String.prototype.trim);
            }
            this.steps = [];
            // add parents
            this.options.steps.forEach(function (step) {
                if (!step.parent_step || !step.parent_step.length) {
                    self.steps.push(step);
                }
            });

            // add children
            this.options.steps.forEach(function (step, index) {
                if (step.parent_step) {
                    self.steps.splice(step.parent_step, 0, step);
                }
            });
            this.build();
            this.$container.data("gform", this);
        },
        build: function () {
            if (!this.options.debug) {
                this.checkDeps();
            }
            this.parseUrl();
            if (typeof store !== "undefined") {
                this.storage = store.namespace("skiggform");
            }
            this.buildUI();
            for (var index = 0; index < this.steps.length; index++) {
                var step = this.steps[index];
                step._index = index;
                this.createStep(step);
            }
            this.setActive(0);
            this.ui.$actionsContainer.appendTo(this.ui.$stepsContainer);
            this.binds();
        },
        buildUI: function () {
            this.$container.empty();
            var $navContainer = $('<div class="skigg-from-nav-container"></div>').appendTo(this.$container);
            this.ui.$nav = $('<ul class="skigg-from-nav"></ul>').appendTo($navContainer);
            this.ui.$navPb = $('<div class="skigg-from-nav-pb"></div>').appendTo(this.ui.$nav);
            this.ui.$stepsContainer = $('<div class="skigg-from-steps-body"></div>').appendTo(this.$container);
            this.ui.$actionsContainer = $('<div class="skigg-from-actions-container"></div>');
            this.ui.$actions = $('<ul class="skigg-from-actions"><li class="skigg-from-action-next-li"><a class="skigg-from-action-next" href="#">next <span class="dashicons dashicons-arrow-right-alt2"></span></a></li><li class="skigg-from-action-next-li"><a href="#" class="skigg-from-action-submit">submit <span class="dashicons dashicons-arrow-right-alt2"></span></a></li></ul>').appendTo(this.ui.$actionsContainer);
            this.ui.$next = this.ui.$actions.find('.skigg-from-action-next');
            this.ui.$submit = this.ui.$actions.find('.skigg-from-action-submit');
        },
        createStep: function (step) {
            var self = this;

            if (!step.parent_step) {
                var $anchor = $('<a href="#" data-index="' + step._index + '"></a>');
                if (step.hasOwnProperty('stepPrimaryLabel') || step.hasOwnProperty('stepSecondaryLabel')) {
                    if (step.hasOwnProperty('stepPrimaryLabel') && step.stepPrimaryLabel.length) {
                        $anchor.append(this._createNavLabel(step.stepPrimaryLabel).addClass('primary-label'));
                    }
                    if (step.hasOwnProperty('stepSecondaryLabel') && step.stepSecondaryLabel.length) {
                        $anchor.append(this._createNavLabel(step.stepSecondaryLabel).addClass('secondary-label'));
                    }
                } else {
                    $anchor.append(this._createNavLabel('Step ' + step._index));
                }
                step.$navLi = $('<li class="skigg-from-nav-li"></li>').append($anchor);
                this.ui.$nav.append(step.$navLi);
            }

            step.$step = $('<div class="skigg-from-step"></div>');
            var $stepContent = $('<div class="skigg-from-step-content"></div>').appendTo(step.$step);

            if (step.hasOwnProperty('question') && step.question.length) {
                var lbl = this.parseQuestion(step.question);
                step.$question = $('<label class="skigg-from-step-question">' + lbl + '</label>');
                $stepContent.append(step.$question);
            }

            if (step.hasOwnProperty('field_type') && step.field_type.length) {
                var inp_type = step.field_type;
                if (inp_type === 'number-phone') {
                    inp_type = 'number';
                }
                step.$control = $('<input class="skigg-from-step-control" type="' + inp_type + '" spellcheck="false" />');
                var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
                step.$control.attr("autocomplete", (isChrome ? "nope" : "off"));

                if (step.hasOwnProperty('field') && step.field.length) {
                    step.$control.data("field", step.field);
                    step.$control.val(this.getFromStorage(step.field));
                }
                if (step.required === true) {
                    if (step.field_type === 'email') {
                        step.controlValidation = function () {
                            var deferred = $.Deferred();
                            self.lockNav();

                            var enteredEmail = step.$control.val();
                            if (enteredEmail === '') {
                                return deferred.resolve(false);
                            }

                            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            if (!re.test(String(enteredEmail).toLowerCase())) {
                                return deferred.resolve(false);
                            }

                            if (step.useBlackList) {
                                var domain = enteredEmail.split('@').pop();
                                for (var i = 0; i < self.options.blackList.length; i++) {
                                    var test_string = self.options.blackList[i];
                                    if (test_string.substring(0, 1) == '(') {
                                        var re = new RegExp(test_string, 'gi');
                                        if (re.test(domain)) {
                                            return deferred.resolve(false);
                                        }
                                    } else {
                                        if (test_string.indexOf(domain) > -1) {
                                            return deferred.resolve(false);
                                        }
                                    }
                                }
                                return deferred.resolve(true);
                            }
                            return deferred.resolve(true);
                        }
                    } else if (step.field_type === 'number-phone' && self.options.numverify_apikey.length) {
                        step.controlValidation = function () {
                            var number = step.$control.val(), deferred = $.Deferred();
                            self.lockNav();
                            if (!number.length) {
                                return deferred.resolve(false);
                            }
                            $.ajax({
                                url: 'http://apilayer.net/api/validate?access_key=' + self.options.numverify_apikey + '&number=' + number,
                                success: function (api_response) {
                                    deferred.resolve(api_response.valid);
                                }
                            });
                            return deferred.promise();
                        }
                    } else {
                        step.controlValidation = function () {
                            self.lockNav();
                            return $.Deferred().resolve(step.$control.val() !== '');
                        }
                    }
                }

                step.$control.on(
                    "input change",
                    function (e) {
                        if (step.required === true) {
                            if (step._index === self.steps.length - 1) {
                                self.submitVisible(this.value.length);
                            } else {
                                self.nextVisible(this.value.length);
                            }
                        }
                        self.saveInStorage(step.field, this.value);
                        self.checkFontSize(this);
                    }
                );

                $stepContent.append(step.$control);
                step.$control.on(
                    "keyup",
                    function (e) {
                        if (e.keyCode === 13) {
                            self.next(self.currentIndex + 1);
                        }
                    }
                );
            }

            this.ui.$stepsContainer.append(step.$step);
        },
        checkFontSize: function (element) {
            var $element = $(element);
            var s = $('<span >' + $element.val() + '</span>');
            s.css({
                position: 'absolute',
                left: -9999,
                top: -9999,
                'font-family': $element.css('font-family'),
                'font-size': this.options.maxControlFont,
                'font-weight': $element.css('font-weight'),
                'font-style': $element.css('font-style')
            });
            $('body').append(s);
            var textWidth = s.width(), maxWidth = $element.width();
            s.remove();
            var fontSize = this.options.maxControlFont * ((maxWidth - 2) / textWidth);
            if (fontSize < this.options.maxControlFont) {
                $element.css('font-size', fontSize + 'px');
            } else {
                $element.css('font-size', this.options.maxControlFont + 'px');
            }
        },
        createThankYou: function () {
            var text = 'All set, thanks for reaching out {firstName}.';
            this.ui.$stepThankYou = $('<div class="skigg-from-step thank-you"><div class="skigg-from-step-content"><label class="skigg-from-step-question">' + this.parseQuestion(text) + '</label><img src="' + this.options.tmpl_path + '/assets/images/smile.svg"/></div></div>');
            this.ui.$stepThankYou.insertBefore(this.ui.$actionsContainer);
        },
        parseQuestion: function (string) {
            if (string.indexOf('{') > -1) {
                var rxp = /{([^}]+)}/g;
                var curMatch = rxp.exec(string);
                if (curMatch.length) {
                    var val = this.formData[curMatch[1]];
                    if ((curMatch[1] === 'name') && val && (val.length > 0)) {
                        val = val.split(" ")[0];
                    }
                    if (this.isDefined(val)) {
                        string = string.replace(curMatch[0], '<span class="field-value">' + val + '</span>');
                    } else {
                        string = string.replace(curMatch[0], '<span class="field-value"></span>');
                    }
                }
            }
            return string;
        },
        updateTopProgress: function () {
            var w = 0;
            this.ui.$nav.find('li.skigg-from-nav-li').each(function () {
                var $this = $(this);
                if ($this.hasClass('active') || $this.hasClass('visited')) {
                    w += $this.width();
                }
            });
            this.ui.$navPb.width(w);
        },
        setActive: function (index) {
            var self = this;
            if (index >= 0 && index < this.steps.length) {
                this.ui.$nav.find('li.active').removeClass('active');
                this.ui.$stepsContainer.find('.skigg-from-step.active').removeClass('active');
                this.currentIndex = index;
                var _step = this.steps[index];
                if (_step.$navLi) {
                    _step.$navLi.addClass('active');
                }
                _step.$step.addClass('active');
                self.updateTopProgress();
                this.nextVisible(true);

                if (index === this.steps.length - 1) {
                    this.createThankYou();
                    this.nextVisible(false);
                    this.submitVisible(true);
                } else {
                    this.nextVisible(true);
                    this.submitVisible(false);
                }

                if (_step.required === true) {
                    if (_step.$control.val() === '') {
                        this.nextVisible(false);
                        this.submitVisible(false);
                    }
                }

                if (this.isDefined(_step.$control)) {
                    var _timer = setInterval(function () {
                        if (_step.$control.is(':visible')) {
                            _step.$control.focus();
                            self.checkFontSize(_step.$control[0]);
                            clearInterval(_timer);
                        }
                    }, 200);
                }
            }
        },
        updateQuestion: function (stepIndex, fieldValue) {
            var _step = this.steps[stepIndex];
            if (this.isDefined(_step) && this.isDefined(_step.$question)) {
                //
                if (_step.question.indexOf('{') > -1) {
                    var question = _step.question;
                    var rxp = /{([^}]+)}/g;
                    var curMatch = rxp.exec(question);
                    if (curMatch.length) {
                        var val = this.formData[curMatch[1]];
                        if ((curMatch[1] === 'name') && val && (val.length > 0)) {
                            val = val.split(" ")[0];
                        }
                        if (this.isDefined(val)) {
                            question = question.replace(curMatch[0], '<span class="field-value">' + val + '</span>');
                        } else {
                            question = question.replace(curMatch[0], '<span class="field-value"></span>');
                        }
                    }
                    _step.$question.html(question);
                }
            }
        },
        _createNavLabel: function (text) {
            return $('<label class="skigg-from-nav-li-step-label">' + text + '</label>');
        },
        next: function (index) {
            var self = this;
            var currentStep = this.steps[this.currentIndex];
            var nextIndex = ((this.currentIndex + 1) === index) ? index : (this.currentIndex + 1);

            var _exec = function () {
                currentStep.$control.removeClass('skigg-from-step-control-error');
                if (currentStep.hasOwnProperty('field') && currentStep.field.length) {
                    self.formData[currentStep.field] = currentStep.$control.val();
                    self.updateQuestion(nextIndex);
                }
                if (currentStep.$navLi) {
                    currentStep.$navLi.addClass('visited');
                }

                if (currentStep._index == self.steps.length - 1) {
                    self.submit();
                } else {
                    self.setActive(nextIndex);
                }
            }

            if ($.isFunction(currentStep.controlValidation)) {
                currentStep.controlValidation().then(function (isValid) {
                    if (isValid) {
                        _exec();
                    } else {
                        currentStep.$control.addClass('skigg-from-step-control-error');
                        currentStep.$control.focus();
                        if (self.isDefined(currentStep.invalidError)) {
                            currentStep.$question.html(currentStep.invalidError);
                        }
                    }

                }).always(function () {
                    self.unlockNav();
                });
            } else {
                _exec();
            }
        },
        lockNav: function () {
            this.ui.$next.parent().addClass('skigg-from-step-control-disabled');
            this.ui.$submit.parent().addClass('skigg-from-step-control-disabled');
        },
        unlockNav: function () {
            this.ui.$next.parent().removeClass('skigg-from-step-control-disabled');
            this.ui.$submit.parent().removeClass('skigg-from-step-control-disabled');
        },
        prev: function (index) {
            this.setActive(this.isDefined(index) ? index : --this.currentIndex);
        },
        showThankYou: function () {
            this.ui.$nav.parent().addClass('hidden');
            this.ui.$stepsContainer.find('.skigg-from-step.active').removeClass('active');
            this.ui.$actions.parent().addClass('hidden');
            var usrName = this.formData['firstName'];
            if (this.isDefined(usrName)) {
                this.ui.$stepThankYou.find('label.field-value').text(usrName);
            }
            this.ui.$stepThankYou.show();
        },
        submit: function () {
            var self = this;
            var currentStep = this.steps[this.steps.length - 1];

            var _exec = function () {
                currentStep.$control.removeClass('skigg-from-step-control-error');
                if (currentStep.hasOwnProperty('field') && currentStep.field.length) {
                    self.formData[currentStep.field] = currentStep.$control.val();
                }
                self.track(function () {
                    self.showThankYou();
                    //self.clearStorage();
                });
            }

            if ($.isFunction(currentStep.controlValidation)) {
                currentStep.controlValidation().then(function (isValid) {
                    if (isValid) {
                        _exec();
                    } else {
                        currentStep.$control.addClass('skigg-from-step-control-error');
                        currentStep.$control.focus();
                        if (self.isDefined(currentStep.invalidError)) {
                            currentStep.$question.html(currentStep.invalidError);
                        }
                    }
                }).always(function () {
                    self.unlockNav();
                });
            } else {
                _exec();
            }
        },
        nextVisible: function (visible) {
            this.ui.$next.parent()[visible ? 'removeClass' : 'addClass']('hidden');
        },
        submitVisible: function (visible) {
            this.ui.$submit.parent()[visible ? 'removeClass' : 'addClass']('hidden');
        },
        binds: function () {
            var self = this;

            this.ui.$next.click(
                function (e) {
                    e.preventDefault();
                    self.next(self.currentIndex + 1);
                }
            );

            this.ui.$submit.click(
                function (e) {
                    e.preventDefault();
                    self.submit();
                }
            );


            this.ui.$nav.on('click', 'li.visited > a', function (e) {
                e.preventDefault();
                // self.steps[self.currentIndex].$navLi.addClass('visited');
                var _index = $(this).data("index");
                if (_index < self.currentIndex) {
                    self.prev(_index);
                } else {
                    self.next(_index);
                }

            });
        },
        getFromStorage: function (fname) {
            if (this.isDefined(this.storage)) {
                var v = this.storage(fname);
                if (this.isDefined(v) && v !== null) {
                    return v;
                }
            }
            return "";
        },
        saveInStorage: function (fname, value) {
            if (this.options.debug === true) {
                console.log("Store:" + fname + " => " + value);
            }
            if (this.isDefined(this.storage)) {
                this.storage(fname, value)
            }
        },
        clearStorage: function () {
            if (this.isDefined(this.storage)) {
                this.storage.clearAll();
            }
        },
        track: function (onDone) {
            var self = this;
            if (this.options.debug === true) {
                console.log("Track:" + JSON.stringify(this.formData));
            }
            delete self.formData['name'];
            if ((typeof analytics !== "undefined") && !this.isEmptyObject(this.formData)) {
                analytics.identify(analytics.user().anonymousId(), self.formData, {}, function () {
                    analytics.track(skigg_FORM_SEGMENT_TRACK_EVENT_NAME, self.formData, {}, function () {
                        onDone();
                    });
                });
            }
        },
        parseUrl: function () {
            if (typeof url !== "undefined") {
                var self = this, _params = url('?');
                if (this.isDefined(_params)) {
                    this.options.urlFields.forEach(function (p) {
                        if (self.isDefined(_params[p])) {
                            self.formData[p] = _params[p];
                        }
                    });
                }
            }
            self.formData['utm_offer'] = 'ContactUs';
            if (!this.isDefined(self.formData['utm_medium'])) {
                self.formData['utm_medium'] = 'Website - Form';
            }
            if (!this.isDefined(self.formData['utm_source'])) {
                self.formData['utm_source'] = 'DIRECT';
            }
            if (!this.isDefined(self.formData['utm_campaign'])) {
                self.formData['utm_campaign'] = 'FY21-Website-Form-ContactUs-101519';
            }
        },
        checkDeps: function () {
            if (typeof jQuery === "undefined") {
                throw Error('The skigg form require jQuery.');
            }
            if (typeof store === "undefined") {
                throw Error('The skigg form require store plugin.');
            }
            if (typeof url === "undefined") {
                throw Error('The skigg form require js-url plugin.');
            }
            if (typeof analytics === "undefined") {
                throw Error('The skigg form require js segment library.');
            }
        }
    };

    skigg_FORM.make(js.container, JSON.parse(js.form_payload));
})(jQuery);