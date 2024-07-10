export default
    Ext.define("SYNOCOMMUNITY.RRManager.Overview.StatusBoxTmpl", {
        extend: "Ext.XTemplate",
        helper: SYNOCOMMUNITY.RRManager.Helper,
        formatString: function (str, ...args) {
            return str.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] !== 'undefined' ? args[number] : match;
            });
        },
        constructor: function (e) {
            let t = "";
            switch (e.type) {
                case 'hw_info':
                    t = this.createTplHwInfo();
                    break;
                case 'rr_info':
                    t = this.createTplRrInfo();
                    break;
                case 'rrm_info':
                    t = this.createTplRrmInfo();
                    break;
            }
            t.push(this.fillConfig(e)),
                this.callParent(t);
        },

        getTranslate: (key) => {
            const translations = {
                'hw_info': 'HW info',
                'rr_info': 'RR version',
                'rrm_info': 'RR Manager version',
            };
            return translations[key];
        },
        getStatusText: (type, status) => {
            const statusTexts = {
                'hw_info': 'RR version',
                'rr_info': 'RR Manager version',
                'rrm_info': 'RR Actions'
            };
            return statusTexts[type];
        },
        isBothErrorWarn: (error, warning) => error !== 0 && warning !== 0,
        showNumber: (number) => {
            return number;
        },

        fillConfig: function (e) {
            const templateConfig = { compiled: true, disableFormats: true },
                translations = {};

            return (
                {
                    // getTranslate: (key) => translations[key],
                    // getStatusText: (type, status) => {
                    //     const statusTexts = {
                    //         'fctarget': translations.status.fctarget[status],
                    //         'target': translations.status.target[status],
                    //         'lun': translations.status.lun[status],
                    //         'event': translations.status.event[status]
                    //     };
                    //     return statusTexts[type];
                    // },
                    // isBothErrorWarn: (error, warning) => error !== 0 && warning !== 0,
                    // showNumber: (number) => number // > 99 ? '99+' : number
                },
                Ext.apply(templateConfig, e)
            );
        },
        createTplHwInfo: function () {
            return [
                '<div class="iscsi-overview-statusbox iscsi-overview-statusbox-{type} iscsi-overview-statusbox-{errorlevel} iscsi-overview-statusbox-{clickType}">',
                '<div class="statusbox-titlebar"></div>',
                '<div class="statusbox-box">',
                '<div class="statusbox-title">',
                "<h3>{[ values.title ]} </h3>",
                "</div>",
                '<div class="statusbox-title-right">',
                "<h3>{[ this.showNumber(values.total) ]}</h3>",
                "</div>",
                '<div class="x-clear"></div>',
                '<div class="statusbox-title-padding">',
                "</div>",
                '<tpl if="! this.isBothErrorWarn(error, warning)">',
                '<div class="statusbox-block statusbox-block-{errorlevel}">',
                '</div>',
                '<div class="statusbox-text" ext:qtip="{[ values.text ]}">{[ values.text ]}</div>',
                '<div class="statusbox-text" ext:qtip="{[ values.text2 ]}">{[ values.text2 ]}</div>',
                '<div class="statusbox-text" ext:qtip="{[ values.text3 ]}">{[ values.text3 ]}</div>',
                "</div>",
                "</tpl>",
                "</div>",
                "</div>",
            ];
        },
        createTplRrInfo: function () {
            return [
                '<div class="iscsi-overview-statusbox iscsi-overview-statusbox-{type} iscsi-overview-statusbox-{errorlevel} iscsi-overview-statusbox-{clickType}">',
                '<div class="statusbox-titlebar"></div>',
                '<div class="statusbox-box">',
                '<div class="statusbox-title">',
                "<h3>{[ values.title ]} </h3>",
                "</div>",
                '<div class="statusbox-title-right">',
                "<h3>{[ this.showNumber(values.total) ]}</h3>",

                "</div>",
                '<div class="x-clear"></div>',
                '<div class="statusbox-title-padding">',
                "</div>",
                '<tpl if="! this.isBothErrorWarn(error, warning)">',
                '<div class="statusbox-block statusbox-block-{errorlevel}">',
                '<div class="statusbox-number">{[ values.rrVersion ]}',
                '</div>',
                '<div class="statusbox-text" ext:qtip="{[ values.rrVersion ]}">{[ values.rrVersion ]}</div>',
                "</div>",
                "</tpl>",
                "</div>",
                "</div>",
            ];
        },
        createTplRrmInfo: function () {
            return [
                '<div class="iscsi-overview-statusbox iscsi-overview-statusbox-{type} iscsi-overview-statusbox-{errorlevel} iscsi-overview-statusbox-{clickType}">',
                '<div class="statusbox-titlebar"></div>',
                '<div class="statusbox-box">',
                '<div class="statusbox-title">',
                "<h3>{[ values.title ]} </h3>",
                "</div>",
                '<div class="statusbox-title-right">',
                "<h3>{[ this.showNumber(values.total) ]}</h3>",
                "</div>",
                '<div class="x-clear"></div>',
                '<div class="statusbox-title-padding">',
                "</div>",
                '<tpl if="! this.isBothErrorWarn(error, warning)">',
                '<div class="statusbox-block statusbox-block-{errorlevel}">',
                '<div class="statusbox-number">{[ values.rrManagerVersion ]}',
                '</div>',
                '<div class="statusbox-text" ext:qtip="{[ values.rrManagerVersion ]}">{[ values.rrManagerVersion ]}</div>',
                "</div>",
                "</tpl>",
                "</div>",
                "</div>",
            ];
        },
    });