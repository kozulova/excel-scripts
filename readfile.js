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

const formatRecord = (data, phone, i) => {
    const allRecordsWithPhone = data.filter(item => normizePhone(item.phone) === phone || item?.phones?.split(',').map(normizePhone)?.includes(phone) || normizePhone(item.phone2) === phone)

    const address = allRecordsWithPhone.find(item => item?.address)?.address
    const splittedAddress = address ? address.split(',') : []

    if (i % 5000 === 0) {
        console.log(i, '5000 formatted')
    }


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
    if (normPhone?.startsWith('+380')) {
        return normPhone
    }

    if (normPhone?.startsWith('38')) {
        return '+' + normPhone;
    }

    if (normPhone?.startsWith('0')) {
        return '+38' + normPhone;
    }

    return '+380' + normPhone
}


const createRecordMap = (data) => {

    const mappedData = new Map()
    for (record of data) {

        if (record.phones) {

            const splittedPhones = record?.phones?.split(/,\s*/).flat()
            for (const phone of splittedPhones) {
                const normPhone = normizePhone(phone)
                if (mappedData.has(normPhone)) {
                    mappedData.set(
                        normPhone, [record, ...mappedData.get(normPhone)]
                    )
                } else {
                    mappedData.set(
                        normPhone, [record]
                    )
                }

            }

        }
        if (record.phone) {
            const normPhone = normizePhone(record.phone)
            if (mappedData.has(normPhone)) {
                mappedData.set(
                    normPhone, [record, ...mappedData.get(normPhone)]
                )
            } else {
                mappedData.set(
                    normPhone, [record]
                )
            }
        }

        if (record.phone1) {
            const normPhone = normizePhone(record.phone)
            if (mappedData.has(normPhone)) {
                mappedData.set(
                    normPhone, [record, ...mappedData.get(normPhone)]
                )
            } else {
                mappedData.set(
                    normPhone, [record]
                )
            }
        }


    }

    return mappedData
}

const formatDataFromMap = (myMap) => {
    const reformattedArray = []

    for (const [key, value] of myMap) {

        const address = value.find(item => item?.address)?.address
        const splittedAddress = address ? address.split(',') : []

        reformattedArray.push({
            phone: key,
            city: value.find(item => item.city !== '')?.city || splittedAddress[0] || '',
            street: value.find(item => item.street !== '')?.street || splittedAddress[1] || '',
            building: value.find(item => item.building !== '')?.building || splittedAddress[2] || '',
            flat: value.find(item => item.flat !== '')?.flat || splittedAddress[3] || '',
            name: value.find(item => item.name !== '')?.name || '',
            tarif: value.find(item => item.tarif !== '')?.tarif || '',
            status: value.find(item => item.status !== '')?.status || '',
        })
    }

    return reformattedArray
}




const main = async () => {
    console.time("Execution Time");
    const start = performance.now();
    console.log(start, 'start')

    const filenames = await readdir(currDir)

    const data = []

    for (let i = 0; i < filenames.length; i++) {
        let currFilePath = currDir + filenames[i];
        var workbook = XLSX.readFile(currFilePath);
        const parsedJSON = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' })
        console.log(parsedJSON.length, `Count of Parsed data from ${filenames[i]}`)

        data.push(...parsedJSON);

    }

    const recordMap = createRecordMap(data)



    const reFormatted = formatDataFromMap(recordMap)



    const newSheet = XLSX.utils.json_to_sheet(reFormatted);

    const newWorkbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'joined');

    const date = new Date()
    const dateString = (date).toDateString().split(" ").join("_") + "_" + date.getUTCMilliseconds()

    XLSX.writeFile(newWorkbook, `${currDir}/joinedExcel_${dateString}.xlsx`);

    console.time("Execution Time2");

    const end = performance.now();
    console.log(`Execution time: ${end - start} milliseconds`);
}

main()
