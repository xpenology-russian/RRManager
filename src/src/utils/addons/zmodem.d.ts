import { ITerminalAddon, Terminal } from '@xterm/xterm';
export interface ZmodeOptions {
    zmodem: boolean;
    trzsz: boolean;
    windows: boolean;
    trzszDragInitTimeout: number;
    onSend: () => void;
    sender: (data: string | Uint8Array) => void;
    writer: (data: string | Uint8Array) => void;
}
export declare class ZmodemAddon implements ITerminalAddon {
    private options;
    private disposables;
    private terminal;
    private sentry;
    private session;
    private denier;
    private trzszFilter;
    constructor(options: ZmodeOptions);
    activate(terminal: Terminal): void;
    dispose(): void;
    consume(data: ArrayBuffer): void;
    private reset;
    private addDisposableListener;
    private trzszInit;
    private zmodemInit;
    private zmodemDetect;
    sendFile(files: FileList): void;
    private receiveFile;
    private writeProgress;
    private bytesHuman;
}
