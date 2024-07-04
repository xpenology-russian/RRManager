// import { Terminal } from '@xterm/xterm';
// import { WebLinksAddon } from '@xterm/addon-web-links';
// import { FitAddon } from '@xterm/addon-fit';
// import { ImageAddon } from '@xterm/addon-image';
// import { WebglAddon } from '@xterm/addon-webgl';
// import { CanvasAddon } from '@xterm/addon-canvas';

// export default
//     Ext.define('SYNOCOMMUNITY.RRManager.TerminalPanel', {
//         extend: "SYNO.ux.Panel",

//         constructor: function (config) {
//             this.callParent([this.fillConfig(config)]);
//         },

//         fillConfig: function (config) {
//             const me = this;
//             const cfg = {
//                 layout: 'fit',
//                 items: [
//                     {
//                         xtype: 'container',
//                         itemId: 'terminalContainer',
//                         cls: 'terminal-container',
//                         layout: 'fit',
//                         style: {
//                             width: '100%',
//                             height: '100%',
//                         }
//                     }
//                 ],                listeners: {
//                     scope: me,
//                     afterrender: me.onAfterRender,
//                     resize: me.onResize
//                 }
//             };
//             return Ext.apply(cfg, config), cfg;
//         },

//         onAfterRender: function () {
//             const me = this;
//             // Defer the initialization to ensure the DOM is ready
//             Ext.defer(function () {
//                 debugger;
//                 const component =me.getComponent("terminalContainer")
//                 const containerEl = component.getEl().dom;
//                 // Initialize the xterm Terminal
//                 me.terminal = new Terminal({
//                     cols: 80,
//                     rows: 24
//                 });
//                 // Initialize the fit addon
//                 me.fitAddon = new FitAddon();
//                 me.terminal.loadAddon(me.fitAddon);

//                 me.WebLinksAddon = new WebLinksAddon();
//                 me.terminal.loadAddon(me.WebLinksAddon);

//                 me.ImageAddon = new ImageAddon();
//                 me.terminal.loadAddon(me.ImageAddon);

//                 me.WebglAddon = new WebglAddon();
//                 me.terminal.loadAddon(me.WebglAddon);

//                 me.CanvasAddon = new CanvasAddon();
//                 me.terminal.loadAddon(me.CanvasAddon);

//                 me.terminal.open(containerEl);

//                 // Optional: You can add some initial content to the terminal
//                 me.terminal.write('Welcome to the xterm.js terminal!\r\n');

//                 // Adjust terminal size to fit the container
//                 me.resizeTerminal();
//             }, 500);
//         },

//         onResize: function () {
//             this.resizeTerminal();
//         },

//         resizeTerminal: function () {
//             const me = this;
//             if (me.terminal) {
//                 const me = this;
//                 if (me.terminal && me.fitAddon) {
//                     me.fitAddon.fit();
//                 }
//                 // const containerEl = me.getEl().dom;
//                 // const width = containerEl.clientWidth;
//                 // const height = containerEl.clientHeight;

//                 // // Calculate new cols and rows based on the container size
//                 // const cols = Math.floor(width / me.terminal._core._renderService.dimensions.actualCellWidth);
//                 // const rows = Math.floor(height / me.terminal._core._renderService.dimensions.actualCellHeight);
//                 // if (cols && rows) {
//                 //     me.terminal.resize(cols, rows);
//                 // }
//             }
//         },

//         // Optional: Method to send data to the terminal
//         write: function (data) {
//             if (this.terminal) {
//                 this.terminal.write(data);
//             }
//         }
//     });