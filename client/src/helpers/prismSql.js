import Prism from 'prismjs';

// Custom SQL grammar that separates data types from keywords
Prism.languages['sqlbase'] = {
  comment: {
    pattern: /(--).*|\/\*[\s\S]*?\*\//,
    greedy: true,
  },
  string: {
    pattern: /'(?:''|[^'\r\n])*'/,
    greedy: true,
  },
  // Data types — orange
  datatype: {
    pattern: /\b(?:BIGINT|BIGSERIAL|BOOLEAN|BOOL|BYTEA|CHAR|CHARACTER\s+VARYING|CHARACTER|CIDR|DATE|DECIMAL|DOUBLE\s+PRECISION|FLOAT[48]?|INET|INT(?:EGER)?[248]?|INTERVAL|JSON[B]?|MACADDR|MONEY|NUMERIC|POINT|REAL|SERIAL[28]?|SMALLINT|SMALLSERIAL|TEXT|TIME(?:STAMP(?:\s+WITH(?:OUT)?\s+TIME\s+ZONE)?)?|TSVECTOR|TSQUERY|UUID|VARCHAR|XML)\b/i,
    alias: 'datatype',
  },
  // SQL keywords — purple
  keyword: {
    pattern: /\b(?:A(?:LL|LTER|ND|NY|S(?:C)?|T)|B(?:EGIN|ET(?:WEEN)?|Y)|C(?:A(?:SCADE|SE)|HECK|O(?:LLATE|LUMN|MMIT|NSTRAINT)|REATE|ROSS)|D(?:A(?:TABASE)|E(?:FAULT|LETE|SC)|ISTINCT|ROP)|E(?:LSE|ND|XCEPTION|XISTS|XTRACT)|F(?:ALSE|ILTER|IRST|O(?:REIGN|R)|ROM|ULL)|G(?:RANT|ROUP(?:\s+BY)?)|H(?:AVING)|I(?:F(?:\s+EXISTS|\s+NOT\s+EXISTS)?|N(?:DEX|NER|SERT|TERSECT)?|S)|J(?:OIN)|K(?:EY)|L(?:A(?:ST|TERAL)|EFT|I(?:KE|MIT))|N(?:ATURAL|O(?:\s+ACTION|T(?:\s+NULL)?)?|ULL(?:S)?)|O(?:F(?:FSET)?|N(?:\s+DELETE|\s+UPDATE)?|R(?:DER(?:\s+BY)?)?|UTER|VER)|P(?:A(?:RTITION)|RIMARY)|R(?:E(?:FERENCES|STRICT|TURNING|VOKE)|IGHT|OLLBACK)|S(?:CHEMA|E(?:LECT|T)|OME|UBSTRING|TRING(?:AGG)?)|T(?:A(?:BLE|BLE\s+IF\s+NOT\s+EXISTS)|HEN|RANSACTION|RUNCATE|RUE)|U(?:NION|NIQUE|PDATE|SING)|V(?:ALUES|IEW)|W(?:HERE|I(?:NDOW|TH(?:IN\s+GROUP)?)|HEN)|EXCEPT|ADD|ASC|OUTER|RETURNING|HAVING|LIMIT|CASE|WHEN|THEN|ELSE|END|CROSS|INNER|LEFT|RIGHT|FULL|NATURAL|LATERAL|OVER|PARTITION|WINDOW|FILTER|WITHIN|GROUP|COLLATE|EXTRACT|BETWEEN|NULL|TRUE|FALSE|NOT|AND|OR|IN|IS|AS|ON|BY|DO|NO)\b/i,
  },
  // Numbers — orange
  number: /\b\d+(?:\.\d*)?(?:[eE][+-]?\d+)?\b/,
  // Operators
  operator: /[=<>!]+|::|\|\||&&|\+|-|\*|\//,
  // Punctuation
  punctuation: /[;,().[\]{}]/,
};

export const highlightSQL = code =>
  Prism.highlight(code, Prism.languages['sqlbase'], 'sqlbase');
