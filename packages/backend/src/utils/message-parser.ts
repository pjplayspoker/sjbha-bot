/**
 * Pulls parameters out of a command-line like string,
 * where `-param [...value]` gets converted to `{param: 'value'}`
 * 
 * Booleans are used like `--somebool`
 * Numbers get auto cast if `Number.isInteger` is true
 * 
 * @param str A string like 'command -key value --boolean'
 */
export default function parseMessage(str: string) : Record<string, unknown> {
  const opt : Record<string, unknown> = {};

  let currentProp = '';

  str.split (' ').forEach (section => {
    if (section.startsWith ('--')) {
      currentProp = '';

      const prop = section.replace ('--', '');
      opt[prop] = true;
    }
    else if (section.startsWith ('-')) {
      const prop = section.replace ('-', '');
      currentProp = prop;
      opt[currentProp] = '';
    }
    else if (currentProp) {
      let currentVal = opt[currentProp];
      
      if (typeof currentVal === 'string') {
        // Adds a space if a word exists already
        if (currentVal.length) {
          currentVal += ' ';
        }

        currentVal += section;

        opt[currentProp] = currentVal;
      }
      else {
        throw new Error (`Parsing string failed; Parser thought currentVal was a string, but it's not (currentVal: ${currentVal})`);
      }
    }
  });

  console.log ('OPT', opt);

  return opt;
}