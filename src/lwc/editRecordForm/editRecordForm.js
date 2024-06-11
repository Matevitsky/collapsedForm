import { api, LightningElement, track, wire } from 'lwc';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import REGISTRATION_NUMBER_OF_COMPANY from '@salesforce/schema/Account.Registration_No_Of_Company__c';
import BANK_NAME from '@salesforce/schema/Account.Bank_Name__c';
import BANK_COUNTRY from '@salesforce/schema/Account.Bank_Country__c';
import BANK_ADDRESS from '@salesforce/schema/Account.Bank_Address__c';
import ROUTING_NUMBER from '@salesforce/schema/Account.Routing_Number__c';
import ACCOUNT_NUMBER from '@salesforce/schema/Account.AccountNumber';
import SWIFT_CODE from '@salesforce/schema/Account.Swift_Code__c';
import IBAN from '@salesforce/schema/Account.Iban__c';
import CURRENCY from '@salesforce/schema/Account.Currency__c';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';

export default class EditRecordForm extends LightningElement {
    @api objectApiName;
    @api fields;
    @api fileUploadLabel;
    @api account;

    @track _isFileUploaded = false;

    isFirstLoad = true;
    isSaveDisabled = true;

    _filePills

    registrationNumberLabel;
    bankNameLabel;
    bankCountryLabel;
    bankAddressLabel;
    routingNumberLabel;
    accountNumberLabel;
    swiftCodeLabel;
    ibanLabel;
    currencyLabel;
    currencyOptions;
    countryOptions;
    recordTypeId;

    renderedCallback() {
        this.validateRequiredFields(false);
    }

    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    wiredAccountInfo({ error, data }) {
        if (data) {
            this.recordTypeId = data.defaultRecordTypeId;
            this.registrationNumberLabel = data.fields[REGISTRATION_NUMBER_OF_COMPANY.fieldApiName].label;
            this.bankNameLabel = data.fields[BANK_NAME.fieldApiName].label;
            this.bankCountryLabel = data.fields[BANK_COUNTRY.fieldApiName].label;
            this.bankAddressLabel = data.fields[BANK_ADDRESS.fieldApiName].label;
            this.routingNumberLabel = data.fields[ROUTING_NUMBER.fieldApiName].label;
            this.accountNumberLabel = data.fields[ACCOUNT_NUMBER.fieldApiName].label;
            this.swiftCodeLabel = data.fields[SWIFT_CODE.fieldApiName].label;
            this.ibanLabel = data.fields[IBAN.fieldApiName].label;
            this.currencyLabel = data.fields[CURRENCY.fieldApiName].label;
        } else if (error) {
            console.error('Error fetching object info:', error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: CURRENCY })
    wiredCurrencyPicklistValues({ error, data }) {
        if (data) {
            this.currencyOptions = data.values.map(option => ({
                label: option.label,
                value: option.value
            }));
        } else if (error) {
            console.error('Error retrieving currency picklist values:', JSON.stringify(error));
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: BANK_COUNTRY })
    wiredBankCountryPicklistValues({ error, data }) {
        if (data) {
            this.countryOptions = data.values.map(option => ({
                label: option.label,
                value: option.value
            }));
        } else if (error) {
            console.error('Error retrieving bank country picklist values:', error);
        }
    }

    get isFileUploaded() {
        if (this.filePills.length > 0) {
            this.isFirstLoad = false;
            this._isFileUploaded = true;
        } else {
            if (this.isFirstLoad) {
                this.isFirstLoad = false;
                this._isFileUploaded = false;
            }
        }

        return this._isFileUploaded;
    }

    set isFileUploaded(value) {
        this._isFileUploaded = value;
    }

    @api set filePills(value) {
        this._filePills = value;
        if (this._filePills.length === 0) {
            this.isFileUploaded = false;
        }
        this.validateRequiredFields();
    }

    get filePills() {
        return this._filePills;
    }

    handleFieldChange(event) {
        const fieldName = event.target.dataset.id;
        const fieldValue = event.target.value;

        const updatedAccount = { ...this.account, [fieldName]: fieldValue };

        this.validateRequiredFields();
        this.dispatchEvent(new CustomEvent('account_changed', { detail: updatedAccount }));
    }

    handleSave() {
        const fields = this.template.querySelectorAll('lightning-input-field');
        let allValid = true;
        fields.forEach(field => {
            if (!field.reportValidity()) {
                allValid = false;
            }
        });
        if (allValid) {
            const accountFields = {};
            fields.forEach(field => {
                accountFields[field.fieldName] = field.value;
            });

            this.dispatchEvent(new CustomEvent('save_account_form'));
        }
    }

    validateRequiredFields(highlight = true) {
        const inputs = this.template.querySelectorAll('lightning-input, lightning-combobox');
        let allValid = true;

        inputs.forEach(input => {
            const isValid = this.validateInputField(input, highlight);
            if (!isValid) {
                allValid = false;
            }
            if (highlight) {
                input.reportValidity();
            }
        });

        if (!this.isFileUploaded) {
            allValid = false;
        }

        this.isSaveDisabled = !allValid;
        this.dispatchEvent(new CustomEvent('field_validation_status', { detail: allValid }));
    }

    validateInputField(input, highlight) {
        input.setCustomValidity('');

        if (input.dataset.id === ROUTING_NUMBER.fieldApiName) {
            return this.validateRoutingNumber(input);
        }

        if (!highlight) {
            return input.checkValidity();
        }

        return input.reportValidity();
    }

    validateRoutingNumber(input) {
        const routingNumber = input.value;
        if (routingNumber !== '' && !/^\d{9}$/.test(routingNumber)) {
            input.setCustomValidity('Routing number must be exactly 9 digits if provided.');
            return false;
        }
        return true;
    }

    handleFilesChange(event) {
        const files = event.target.files;

        this.readFiles(files).then(result => {
            this.dispatchEvent(new CustomEvent('new_file_added', {
                detail: result
            }));
        });
        this.isFileUploaded = true;
        this.validateRequiredFields();
    }

    handleRemoveFile(event) {
        this.dispatchEvent(new CustomEvent('remove_file', { detail: event.detail.item }));
        this.validateRequiredFields();
    }

    async readFiles(files) {
        return await Promise.all([...files].map(file => this.readFile(file)));
    }

    readFile(fileSource) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            const fileName = fileSource.name;
            fileReader.onerror = () => reject(fileReader.error);
            fileReader.onload = () => resolve({ fileName, base64: fileReader.result.split(',')[1] });
            fileReader.readAsDataURL(fileSource);
        });
    }
}
