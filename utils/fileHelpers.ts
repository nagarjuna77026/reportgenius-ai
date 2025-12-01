
export const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split(/\r\n|\n/);
  const result = [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const obj: any = {};
    const currentline = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Regex to handle commas inside quotes

    for (let j = 0; j < headers.length; j++) {
      let val = currentline[j] ? currentline[j].trim().replace(/^"|"$/g, '') : '';
      // Try to convert to number if possible
      if (!isNaN(Number(val)) && val !== '') {
          obj[headers[j]] = Number(val);
      } else {
          obj[headers[j]] = val;
      }
    }
    result.push(obj);
  }
  return result;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
