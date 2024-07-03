Ext.define("SYNOCOMMUNITY.RRManager.IframePanel", {
    extend: "SYNO.ux.Panel",    
    constructor: function (config) {
        this.callParent([this.fillConfig(config)]);
    },
    
    fillConfig: function (config) {
        const me = this;
        const cfg = {
            items: [
                {
                    itemId: "iframeBox",
                    xtype: "box",
                    cls: "iframe-panel",
                    html: '<iframe src="' + (config.iframeSrc || '') + '" style="width:100%; height:100%; border:none;"></iframe>',
                }
            ],
            listeners: {
                scope: me,
                afterrender: me.onAfterRender,
                update: me.updateIframe,
                src_change: me.onSrcChange
            }
        };
        return Ext.apply(cfg, config);
    },
    
    onAfterRender: function () {
        // Example: Add a click event listener if needed
        this.mon(this.body, "click", this.onMouseClick, this);
    },
    
    updateIframe: function () {
        const iframeBox = this.getComponent("iframeBox");
        iframeBox.update('<iframe src="' + this.iframeSrc + '" style="width:100%; height:100%; border:none;"></iframe>');
    },
    
    setSrc: function (src) {
        this.iframeSrc = src;
        this.fireEvent('src_change');
    },
    
    onSrcChange: function () {
        this.updateIframe();
    },
    
    onMouseClick: function () {
        // Example: Fire an event when the iframe panel is clicked
        this.fireEvent("iframeclick", this);
    }
});
