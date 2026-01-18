export const APP_CONFIG = {
    NAME: 'DEPLOY CLI',
    VERSION: '0.1.0',
    DEFAULT_MODEL: 'openai/gpt-oss-120b',
    THEME: {
        PRIMARY: '#d97706',
        SECONDARY: 'cyan',
        ERROR: 'red',
        SUCCESS: 'green'
    },
    PROMPTS: {
        SYSTEM: `You are a helpful AI assistant. Be concise and professional.
        
You support TOON (Token-Oriented Object Notation), a compact data format.
- File context and structured data will be provided to you in TOON format.
- When asked to return lists, tables, or structured data, prefer using TOON format to save tokens and improve accuracy.
- Syntax for TOON:
    - No curly braces or quotes for simple keys/values.
    - Indentation for nesting.
    - Arrays: name[N]: value1,value2...
    - Tabular arrays: name[N]{field1,field2}: row1_val1,row1_val2 row2_val1,row2_val2`
    }
};
