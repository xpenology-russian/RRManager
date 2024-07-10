import { ITerminalAddon, Terminal } from '@xterm/xterm';
export declare class OverlayAddon implements ITerminalAddon {
    private terminal;
    private overlayNode;
    private overlayTimeout?;
    constructor();
    activate(terminal: Terminal): void;
    dispose(): void;
    showOverlay(msg: string, timeout?: number): void;
}
