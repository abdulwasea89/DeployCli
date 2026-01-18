import { encode } from '@toon-format/toon';

export class ToonService {
    /**
     * Converts a JSON-serializable object to TOON format.
     * @param data The data to convert.
     * @returns A string in TOON format.
     */
    static toToon(data: any): string {
        try {
            return encode(data);
        } catch (error) {
            console.error('TOON Encoding Error:', error);
            // Fallback to JSON if TOON fails for any reason
            return JSON.stringify(data, null, 2);
        }
    }
}
