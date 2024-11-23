export abstract class Storage {
    abstract upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string, success: boolean }>
}
