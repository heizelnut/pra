const fs = require('fs')

exports.readCSVFile = filepath => {
	let data
	csv = []
	try {
		data = fs.readFileSync(filepath, 'utf8');
	} catch (err) {
		console.error(err);
	}
	lines = data.trim().split('\n')
	line = 0;
	headers = lines[line++].split(',')
	for (let l = 0; l < lines.length - 1; l++) {
		entry = { id: l + 1 }
		currentLine = lines[line++].split(',')
		for (let h = 0; h < headers.length; h++) {
			entry[headers[h]] = currentLine[h]
		}
		csv.push(entry)
	}
	return csv
}
