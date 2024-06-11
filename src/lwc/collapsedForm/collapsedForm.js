import {api, LightningElement, track} from 'lwc';
import getFiles from '@salesforce/apex/FileUploadController.getFiles';
import getAccount from '@salesforce/apex/AccountController.getAccount';
import saveAccountWithFiles from '@salesforce/apex/AccountController.saveAccountWithFiles';
import REGISTRATION_NUMBER_OF_COMPANY from '@salesforce/schema/Account.Registration_No_Of_Company__c';
import BANK_NAME from '@salesforce/schema/Account.Bank_Name__c';
import BANK_COUNTRY from '@salesforce/schema/Account.Bank_Country__c';
import BANK_ADDRESS from '@salesforce/schema/Account.Bank_Address__c';
import ROUTING_NUMBER from '@salesforce/schema/Account.Routing_Number__c';
import ACCOUNT_NUMBER from '@salesforce/schema/Account.AccountNumber';
import SWIFT_CODE from '@salesforce/schema/Account.Swift_Code__c';
import IBAN from '@salesforce/schema/Account.Iban__c';
import CURRENCY from '@salesforce/schema/Account.Currency__c';
import {notifyRecordUpdateAvailable} from "lightning/uiRecordApi";


export default class CollapsedForm extends LightningElement {
    fileUploadLabel = 'Please attach a bank statement, such as a letter from the bank. Payment will not be possible without verification';

    _recordId;
    @track isSaveDisabled = true;

    @track isSectionOpen = false;
    @track isComplete = false;
    @track filesToDelete = [];
    @track filePills = [];

    isEditMode = true;

    files = [];
    @track account;

    accountFields = [
        {apiName: REGISTRATION_NUMBER_OF_COMPANY.fieldApiName},
        {apiName: BANK_NAME.fieldApiName, required: true},
        {apiName: BANK_COUNTRY.fieldApiName, required: true},
        {apiName: BANK_ADDRESS.fieldApiName},
        {apiName: ROUTING_NUMBER.fieldApiName},
        {apiName: ACCOUNT_NUMBER.fieldApiName, required: true},
        {apiName: SWIFT_CODE.fieldApiName, required: true},
        {apiName: IBAN.fieldApiName, required: true},
        {apiName: CURRENCY.fieldApiName, required: true}];

    connectedCallback() {
        this.getAccount();
        this.loadFiles();
    }

    @api set recordId(value) {
        this._recordId = value;
        this.getAccount();
        this.loadFiles();
    }

    get recordId() {
        return this._recordId;
    }

    get statusMessage() {
        return this.isComplete ? 'Details completed ' : 'Please complete your details here ';
    }

    get buttonIcon() {
        return this.isSectionOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get statusClass() {
        return this.isComplete ? 'slds-text-color_success slds-m-right_auto slds-text-heading_small' : 'slds-text-color_error slds-m-right_auto slds-text-heading_small';
    }

    toggleSection() {
        this.isSectionOpen = !this.isSectionOpen;
    }

    handleValidationStatusChange(event) {
        this.isComplete = event.detail;
    }

    getAccount() {
        getAccount({accountId: this.recordId})
            .then(result => {
                this.account = result;
            })
    }

    handleAccountChange(event) {
        this.account = event.detail;
    }

    loadFiles() {
        getFiles({accountId: this.recordId})
            .then(result => {
                this.filePills = result.map(file => ({
                    label: file.Title,
                    ContentDocumentId: file.ContentDocumentId,
                    href: `/sfc/servlet.shepherd/document/download/${file.ContentDocumentId}`
                }));

            })
            .catch(error => {
                console.error('Error Loading files ' + JSON.stringify(error));
            });
    }

     handleNewFileAdded(event) {
        event.detail.forEach(file => {
            this.filePills.push({
                label: file.fileName, name: file.fileName, file: file
            });
        });

        this.files = [...this.files,... event.detail];
    }

    handleRemoveFile(event) {
        const item = event.detail;
        if (item.file) {
            this.files = this.files.filter(file => file.ContentDocumentId !== item.ContentDocumentId);
        } else {
            this.filesToDelete.push(item.ContentDocumentId);
        }
        this.filePills = this.filePills.filter(i => i.ContentDocumentId !== item.ContentDocumentId);
    }

    handleSaveForm() {
        saveAccountWithFiles(
            {
                account: this.account,
                filesToStore: this.files,
                filesToDelete: this.filesToDelete
            })
            .then(() => {
                    notifyRecordUpdateAvailable([{recordId: this.recordId}])
                        .then(() => {
                                this.loadFiles();
                                this.isEditMode = false;
                            }
                        );
                    this.files = [];
                    this.filesToDelete = [];
                }
            ).catch(error => {
            console.error('FAILED TO SAVE ' + JSON.stringify(error));
        });
    }

    handleEditButtonPressed() {
        this.isEditMode = true;
    }
}