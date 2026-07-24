declare module "node-media-server" {
  interface Config {
    rtmp?: {
      port?: number;
      chunk_size?: number;
      gop_cache?: boolean;
      ping?: number;
      ping_timeout?: number;
    };
    http?: {
      port?: number;
      allow_origin?: string;
      mediaroot?: string;
      trans?: {
        ffmpeg?: string;
        tasks?: Array<{
          app: string;
          hls?: boolean;
          hlsFlags?: string;
        }>;
      };
    };
  }

  class NodeMediaServer {
    constructor(config: Config);
    run(): void;
    on(event: "prePublish", callback: (id: string, streamPath: string, args: any) => void): void;
    on(event: "donePublish", callback: (id: string, streamPath: string, args: any) => void): void;
  }

  export default NodeMediaServer;
}
