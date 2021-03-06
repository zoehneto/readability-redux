
function createJavascript (settings) {
    var js_url = chrome.extension.getURL('readability/Readability.js');
    var js_compat_url = chrome.extension.getURL('readability/readability-compat.js');

    var css_url = chrome.extension.getURL('readability/readability.css');
    var print_url = chrome.extension.getURL('readability/readability-print.css');

    var code = "(function(){showArticleTools=" + settings['show_article_tools'] + ";readConvertLinksToFootnotes=" + settings['enable_links'] + ";readStyle='" + settings['style'] + "';readSize='" + settings['size'] + "';readMargin='" + settings['margin'] + "';_readability_script=document.createElement('SCRIPT');_readability_script.type='text/javascript';_readability_script.src='" + js_url + "';document.getElementsByTagName('head')[0].appendChild(_readability_script);_readability_compat_script=document.createElement('SCRIPT');_readability_compat_script.type='text/javascript';_readability_compat_script.src='" + js_compat_url + "';document.getElementsByTagName('head')[0].appendChild(_readability_compat_script);_readability_css=document.createElement('LINK');_readability_css.rel='stylesheet';_readability_css.href='" + css_url + "';_readability_css.type='text/css';_readability_css.media='screen';document.getElementsByTagName('head')[0].appendChild(_readability_css);_readability_print_css=document.createElement('LINK');_readability_print_css.rel='stylesheet';_readability_print_css.href='" + print_url + "';_readability_print_css.media='print';_readability_print_css.type='text/css';document.getElementsByTagName('head')[0].appendChild(_readability_print_css);})();";

    return code;
}

function render (tab_id) {
    var settings = getSettings();
    //console.log(settings);

    chrome.tabs.sendRequest(tab_id, {'type': 'render'});
}

function getSettings () {
    function parse (x) {
        try {
            return JSON.parse(x);
        } catch (e) {
            return undefined;
        }
    }

    var settings = {
        style: localStorage['style'],
        size: localStorage['size'],
        margin: localStorage['margin'],
        enable_keys: parse(localStorage['enable_keys']),
        keys: parse(localStorage['keys'])
    };

    if (!Array.isArray(settings['keys'])) {
        settings['keys'] = [];
    }

    var defaults = {
        style: 'style-newspaper',
        size: 'size-large',
        margin: 'margin-wide',
        enable_keys: false,
        keys: []
    };

    // Kill all keys with undefined values, so defaults can take over
    Object.keys(settings).forEach(setting => {
        const value = settings[setting];
        if (typeof value === 'undefined') {
          delete settings[setting];
        }
    });

    return Object.assign(defaults, settings);
}

function setSettings (settings) {
    const keys = Object.keys(settings);

    if (keys.indexOf('style') >= 0) {
        settings['style'] = settings['style']
    }
    if (keys.indexOf('size') >= 0) {
        settings['size'] = settings['size']
    }
    if (keys.indexOf('margin') >= 0) {
        settings['margin'] = settings['margin']
    }
    if (keys.indexOf('enable_keys') >= 0) {
        settings['enable_keys'] = JSON.stringify(!!settings['enable_keys']);
    }
    if (keys.indexOf('keys') >= 0) {
        settings['keys'] = JSON.stringify(settings['keys']);
    }

    //console.log('setSettings', settings);

    Object.assign(localStorage, settings);

    chrome.windows.getAll({'populate': true}, function (windows) {
        windows.forEach(w => {
            w.tabs.forEach(tab => chrome.tabs.sendRequest(
                tab.id, {
                    'type': 'newSettings',
                    'settings': getSettings(),
                }
            ));
        });
    });
}

function requestHandler(data, sender, callback) {
    if (data['type'] == 'javascript') {
        if (Object.keys(data).indexOf('settings') >= 0) {
            return callback(createJavascript(data['settings']));
        }
        return callback(createJavascript(getSettings()));
    }
    if (data['type'] == 'setSettings') {
        setSettings(data['settings']);
        return callback();
    }
    if (data['type'] == 'getSettings') {
        return callback(getSettings());
    }
    if (data['type'] == 'render') {
        render(data['tab_id']);
        return callback();
    }
}

chrome.extension.onRequest.addListener(requestHandler);
chrome.extension.onRequestExternal.addListener(requestHandler);

chrome.browserAction.onClicked.addListener(function (tab) {
    render(tab.id);
});
