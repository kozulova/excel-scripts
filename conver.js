const fs = require('fs');

function convertCsvSeparator(inputFile, outputFile) {
  const data = fs.readFileSync(inputFile, { encoding: 'utf-8' });

  // Add BOM for Excel UTF-8 detection
  const bom = '\ufeff';

  // Replace semicolons and wrap numbers in quotes
  const convertedData = bom + data
    .split('\n') // Split into rows
    .map(row =>
      row
        .split(';') // Split columns
        .map(value =>
          /^\d{11,}$/.test(value) ? `"${value}"` : value // Wrap large numbers in quotes
        )
        .join(',')
    )
    .join('\n');

  fs.writeFileSync(outputFile, convertedData, { encoding: 'utf-8' });

  console.log(`Conversion complete: ${outputFile}`);
}

convertCsvSeparator('1.csv', 'output.csv');
