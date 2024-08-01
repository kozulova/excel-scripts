var fs = require('fs');
const path = require('path');
var XLSX = require("xlsx");

const currDir = path.join(__dirname, '/../files/')


const readdir = (dirname) => {
    return new Promise((resolve, reject) => {
        fs.readdir(dirname, (error, filenames) => {
            if (error) {
                reject(error);
            } else {
                resolve(filenames);
            }
        });
    });
};

const headerMapping = {
    'phone': 'Телефон',
    'city': 'Місто',
    'street': 'Вулиця',
    'building': 'Будинок',
    'flat': 'Квартира',
    'name': 'Імя',
    'tarif': 'Тариф',
    'status': 'Статус',

};

const formatRecord = (data, phone) => {
    const allRecordsWithPhone = data.filter(item => normizePhone(item.phone) === phone || item?.phones?.split(',').map(normizePhone)?.includes(phone) || normizePhone(item.phone2) === phone)

    const address = allRecordsWithPhone.find(item => item?.address)?.address
    const splittedAddress = address ? address.split(',') : []


    return {
        phone,
        city: allRecordsWithPhone.find(item => item.tarif !== '')?.city || splittedAddress[0] || '',
        street: allRecordsWithPhone.find(item => item.tarif !== '')?.street || splittedAddress[1] || '',
        building: allRecordsWithPhone.find(item => item.tarif !== '')?.building || splittedAddress[2] || '',
        flat: allRecordsWithPhone.find(item => item.tarif !== '')?.flat || splittedAddress[3] || '',
        name: allRecordsWithPhone.find(item => item.tarif !== '')?.name || '',
        tarif: allRecordsWithPhone.find(item => item.tarif !== '')?.tarif || '',
        status: allRecordsWithPhone.find(item => item.status !== '')?.status || '',
    }
}

const normizePhone = phone => {
    const normPhone = phone?.toString().trim()
    if (normPhone?.startsWith('38')) {
        return '+' + normPhone;
    }

    if (normPhone?.startsWith('0')) {
        return '+38' + normPhone;
    }

    return normPhone
}

const filterUniquePhone = (data) => {
    const phones = data.map(item => {
        return item?.phones?.split(/,\s*/)
    }).flat().concat(data.map(item => item.phone).concat(data.map(item => item.phone1))).filter(phone => phone !== undefined)


    const addBeginToNumber = phones.map(normizePhone)


    const uniquePhones = Array.from(new Set(addBeginToNumber))

    return uniquePhones.map(phone => formatRecord(data, phone))

}

const main = async () => {
    const filenames = await readdir(currDir)

    const data = []

    for (let i = 0; i < filenames.length; i++) {
        let currFilePath = currDir + filenames[i];
        var workbook = XLSX.readFile(currFilePath);
        const parsedJSON = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' })
        console.log(parsedJSON.length, `Count of Parsed data from ${filenames[i]}`)
        data.push(...parsedJSON);

    }


    const uniquePhones = filterUniquePhone(data)

    /*     const updatedData = uniquePhone.map(row => {
            let newRow = {};
            for (let oldKey in row) {
                const newKey = headerMapping[oldKey] || oldKey;
                newRow[newKey] = row[oldKey];
            }
            return newRow;
        }); */

    const newSheet = XLSX.utils.json_to_sheet(uniquePhones);

    const newWorkbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'joined');

    const date = new Date()
    const dateString = (date).toDateString().split(" ").join("_") + "_" + date.getUTCMilliseconds()

    XLSX.writeFile(newWorkbook, `${currDir}/joinedExcel_${dateString}.xlsx`);

}

main()
