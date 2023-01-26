export function toLowerCase(str: string): string {
  let result = '';

  for (let i = 0; i < str.length; i++) {
    let character = str[i];
    let charCode = character.charCodeAt(0);
    if (charCode > 64 && charCode < 91) {
      result += String.fromCharCode(charCode + 32);
    } else {
      result += character;
    }
  }

  return result;
}

export function checkLength(str: string, limit: number): string {
  if (str.length < limit) {
    return str;
  }

  return str.substring(limit as i32);
}
