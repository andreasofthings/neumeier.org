// obtain cookieconsent plugin
var cc = initCookieConsent();

// example logo
// var logo = '<img src="https://fontmeme.com/permalink/220805/3b90158d204fdd325173a5c7873e7cc1.png" alt="Logo" loading="lazy" style="margin-left: -4px; margin-bottom: -5px; height: 35px">';
var cookie = '🍪';

// run plugin with config object
cc.run({
    current_lang : 'en',
    // autoclear_cookies : false,               // default: false
    // cookie_name: 'cc_cookie_demo1',          // default: 'cc_cookie'
    cookie_expiration : 365,                    // default: 182
    page_scripts: true,                         // default: false

    auto_language: browser,                     // default: null; could also be 'browser' or 'document'
    // autorun: true,                           // default: true
    delay: 10,                                  // default: 0
    // force_consent: false,
    hide_from_bots: true,                       // default: false
    // remove_cookie_tables: false              // default: false
    // cookie_domain: location.hostname,        // default: current domain
    // cookie_path: "/",                        // default: root
    // cookie_same_site: "Lax",
    // use_rfc_cookie: false,                   // default: false
    // revision: 0,                             // default: 0

    gui_options: {
        consent_modal: {
            layout: 'box',                      // box,cloud,bar
            position: 'bottom right',           // bottom,middle,top + left,right,center
            transition: 'slide'                 // zoom,slide
        },
        settings_modal: {
            layout: 'box',                      // box,bar
            // position: 'left',                // right,left (available only if bar layout selected)
            transition: 'slide'                 // zoom,slide
        }
    },

    onFirstAction: function(){
        console.log('onFirstAction fired');
    },

    onAccept: function (cookie) {
        console.log('onAccept fired ...');
    },

    onChange: function (cookie, changed_preferences) {
        console.log('onChange fired ...');
    },

    languages: {
        'en': {
            consent_modal: {
                title: cookie + ' We use cookies! ',
                description: 'Hi, this website uses essential cookies to ensure its proper operation and tracking cookies to understand how you interact with it. The latter will be set only after consent. <button type="button" data-cc="c-settings" class="cc-link">Let me choose</button>',
                primary_btn: {
                    text: 'Accept all',
                    role: 'accept_all'              // 'accept_selected' or 'accept_all'
                },
                secondary_btn: {
                    text: 'Choose',
                    role: 'settings'        // 'settings' or 'accept_necessary'
                }
            },
            settings_modal: {
                // title: logo,
                save_settings_btn: 'Save settings',
                accept_all_btn: 'Accept all',
                reject_all_btn: 'Reject all',
                close_btn_label: 'Close',
                cookie_table_headers: [
                    {col1: 'Name'},
                    {col2: 'Domain'},
                    {col3: 'Expiration'},
                    {col4: 'Description'}
                ],
                blocks: [
                    {
                        title: 'Cookie usage 📢',
                        description: 'I use cookies to ensure the basic functionalities of the website and to enhance your online experience. You can choose for each category to opt-in/out whenever you want. For more details relative to cookies and other sensitive data, please read the full <a href="#" class="cc-link">privacy policy</a>.'
                    }, {
                        title: 'Strictly necessary cookies',
                        description: 'These cookies are essential for the proper functioning of my website. Without these cookies, the website would not work properly',
                        toggle: {
                            value: 'necessary',
                            enabled: true,
                            readonly: true          // cookie categories with readonly=true are all treated as "necessary cookies"
                        }, 
                        cookie_table: [
                            {
                                col1: 'cc_cookie',
                                col2: 'neumeier.org',
                                col3: '365 days',
                                col4: 'Your choice over cookie usage.',
                            }, {
                                col1: '^_pk',
                                col2: 'neumeier.org',
                                col3: '365 days',
                                col4: 'General session.',
                            },

                        ]
                    }, {
                        title: 'Analytics & Performance cookies',
                        description: "Analytics",
                        toggle: {
                            value: 'analytics',
                            enabled: true,
                            readonly: false
                        },
                        cookie_table: [
                            {
                                col1: '^mtm',
                                col2: 'pramari.de',
                                col3: '365d',
                                col3: 'Our own analytics. pramari.de is hosted and operated by neumeier.org.',
                                is_regex: true
                            }, {
                                col1: '^matomo',
                                col2: 'pramari.de',
                                col3: '365d',
                                col3: 'Our own analytics. pramari.de is hosted and operated by neumeier.org.',
                                is_regex: true
                            },
                        ]
                    },
                ]
            }
        }
    }

});
