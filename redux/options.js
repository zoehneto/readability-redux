
var settings = {
    init: function () {
        document.querySelectorAll('select').forEach(elem => elem.onchange = () => {
            this.preview();
            this.markDirty();
        });
        document.querySelectorAll('input').forEach(elem => elem.onchange = () => {
            this.markDirty();
        });
        document.querySelector('#cancel').onclick = () => {
            this.load();
        }
        document.querySelector('#save').onclick = () => {
            this.save();
        }
        this.load();
    },

    getChecked: (name) => document.querySelector(`#${name}`).checked,

    setChecked: (name, checked) => {
        const elem = document.querySelector(`#${name}`);
        if (checked) {
            elem.setAttribute('checked', 'checked');
        } else {
            elem.removeAttribute('checked');
        }
    },

    getSelect: (name) => {
        const elem = document.querySelector(`#${name}`);
        return elem.options[elem.selectedIndex].value;
    },

    setSelect: function (name, value) {
        var elem = document.querySelector('#' + name + ' option[value=' + value + ']');
        if (!elem) {
            elem = document.querySelector('#' + name + ' option:first-child');
        }
        elem.setAttribute('selected', 'selected');
    },

    markDirty: () => document.querySelector('#save').removeAttribute('disabled'),

    markClean: () => document.querySelector('#save').setAttribute('disabled', 'disabled'),

    save: function () {
        var settings = {
            style: this.getSelect('r_style'),
            size: this.getSelect('r_size'),
            margin: this.getSelect('r_margin'),
            enable_keys: this.getChecked('enable_keys'),
            keys: keybox.keys
        };

        console.log(settings);
        
        chrome.extension.sendRequest({
            'type': 'setSettings',
            'settings': settings
        },
        this.markClean.bind(this));
    },

    load: function () {
        chrome.extension.sendRequest({'type': 'getSettings'}, (settings) => {
            console.log(settings);
            this.setSelect('r_style', settings['style']);
            this.setSelect('r_size', settings['size']);
            this.setSelect('r_margin', settings['margin']);
            keybox.keys = settings['keys'];
            if (settings['enable_keys']) {
                keybox.enable();
            } else {
                keybox.disable();
            }

            keybox.update();
            this.preview()
            this.markClean();
        });
    },

    /* This is a bit wicked, but doing plain simple 
     * location = 'javascript:...' resulted in blank iframe.
     */
    hello_from_child: function (preview_window) {
        this.preview_window = preview_window;
        this.preview();
    },

    preview_window: null,

    preview: function () {
        console.log("preview");
        var settings = {
            style: this.getSelect('r_style'),
            size: this.getSelect('r_size'),
            margin: this.getSelect('r_margin')
        };

        chrome.extension.sendRequest({'type': 'javascript', 'settings': settings}, function (js) {
            if (this.preview_window !== null)
            {
                this.preview_window.inject(js);
            }
            else console.log('ZOMG! Preview window IS NULL!');
        }.bind(this));
    }
};


var keybox = {
    pressed: 0,
    keys: [],
    enabled: false,

    init: function () {
        var keys = document.querySelector('#keys');
        keys.onkeydown = this.keydown.bind(this); 
        keys.onkeyup = this.keyup.bind(this);
        keys.onfocus = this.focus.bind(this);
        keys.onblur = this.blur.bind(this);
        document.querySelector('#enable_keys').onchange = this.checkbox.bind(this);
    },

    enable: function () {
        settings.setChecked('enable_keys', true);
        const keys_elem = document.querySelector('#keys');
        keys_elem.removeAttribute('style');
        keys_elem.removeAttribute('readonly');
        this.enabled = 1;
    },

    disable: function () {
        settings.setChecked('enable_keys', false);
        const keys_elem = document.querySelector('#keys');
        keys_elem.setAttribute('style', 'background-color: silver; color: gray;');
        keys_elem.setAttribute('readonly', 'true');
        this.enabled = 0;
    },

    checkbox: function () {
        if (settings.getChecked('enable_keys')) {
            this.enable();
        } else {
            this.disable();
        }
    },

    // It sometimes fails, like when Ctrl+Shift+U, U has a strange key code 229. Dunno why.
    keydown: function (e) {
        if (!this.enabled) {
            return;
        }

        if (!((e.which >= 65 && e.which <= 90) || e.which == 16 || e.which == 17 || e.which == 18)) {
            return false;
        }

        if (this.pressed == 0) {
            this.keys = [];
        }

        // Degenerate situation
        if (this.keys.indexOf(e.which) >= 0) {
            this.keys = [];
            this.pressed = 0;
        }

        this.keys.push(e.which);
        this.pressed++;

        settings.markDirty();
        this.update();
    },

    keyup: function (e) {
        if (!this.enabled) {
            return;
        }

        if (!((e.which >= 65 && e.which <= 90) || e.which == 16 || e.which == 17 || e.which == 18)) {
            return false;
        }

        this.pressed--;

        this.update();
    },

    update: function () {
        var value = [];
        this.keys.sort();

        for (var i = 0; i < this.keys.length; i++) {
            var key = this.keys[i];
            if (key >= 65 && key <= 90) {
                value.push(String.fromCharCode(key));
            }

            if (key == 16) {
                value.push("Shift");
            }

            if (key == 17) {
                value.push("Ctrl");
            }

            if (key == 18) {
                value.push("Alt");
            }
        }

        document.querySelector('#keys').setAttribute('value', value.join(' + '));
    },

    focus: function () {
        if (!this.enabled) {
            return;
        }

        $('#keys').css('background-color', '#ebeff9');
    },

    blur: function () {
        if (!this.enabled) {
            return;
        }

        $('#keys').css('background-color', '');
        $('#keys').css('color', '');
    }
};

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector('#example iframe').onload = () => {
        settings.init();
        keybox.init();
    };
});
