"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverlayAddon = void 0;
// ported from hterm.Terminal.prototype.showOverlay
// https://chromium.googlesource.com/apps/libapps/+/master/hterm/js/hterm_terminal.js
const decko_1 = require("decko");
class OverlayAddon {
    constructor() {
        this.overlayNode = document.createElement('div');
        this.overlayNode.style.cssText = `border-radius: 15px;
font-size: xx-large;
opacity: 0.75;
padding: 0.2em 0.5em 0.2em 0.5em;
position: absolute;
-webkit-user-select: none;
-webkit-transition: opacity 180ms ease-in;
-moz-user-select: none;
-moz-transition: opacity 180ms ease-in;`;
        this.overlayNode.addEventListener('mousedown', e => {
            e.preventDefault();
            e.stopPropagation();
        }, true);
    }
    activate(terminal) {
        this.terminal = terminal;
    }
    dispose() { }
    showOverlay(msg, timeout) {
        const { terminal, overlayNode } = this;
        if (!terminal.element)
            return;
        overlayNode.style.color = '#101010';
        overlayNode.style.backgroundColor = '#f0f0f0';
        overlayNode.textContent = msg;
        overlayNode.style.opacity = '0.75';
        if (!overlayNode.parentNode) {
            terminal.element.appendChild(overlayNode);
        }
        const divSize = terminal.element.getBoundingClientRect();
        const overlaySize = overlayNode.getBoundingClientRect();
        overlayNode.style.top = (divSize.height - overlaySize.height) / 2 + 'px';
        overlayNode.style.left = (divSize.width - overlaySize.width) / 2 + 'px';
        if (this.overlayTimeout)
            clearTimeout(this.overlayTimeout);
        if (!timeout)
            return;
        this.overlayTimeout = window.setTimeout(() => {
            overlayNode.style.opacity = '0';
            this.overlayTimeout = window.setTimeout(() => {
                if (overlayNode.parentNode) {
                    overlayNode.parentNode.removeChild(overlayNode);
                }
                this.overlayTimeout = undefined;
                overlayNode.style.opacity = '0.75';
            }, 200);
        }, timeout || 1500);
    }
}
__decorate([
    decko_1.bind
], OverlayAddon.prototype, "showOverlay", null);
exports.OverlayAddon = OverlayAddon;
//# sourceMappingURL=overlay.js.map