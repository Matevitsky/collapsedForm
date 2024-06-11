import {api, LightningElement, track} from 'lwc';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';

export default class ViewRecordForm extends LightningElement {
    ACCOUNT_OBJECT_NAME = ACCOUNT_OBJECT.objectApiName;

    @api recordId;
    @api fields;
    @api filePills;

    @track fieldValues = [];

    handleLoadFields(event) {
        let accountFieldsInfo = event.detail.objectInfos.Account.fields;
        let fields = event.detail.records[this.recordId].fields;

        this.fieldValues = this.fields.map(field => {
            return {
                ...field,
                label: accountFieldsInfo[field.apiName].label,
                value: fields[field.apiName].value
            };
        });
    }

    handleDownload(event) {
        const contentDocumentId = event.currentTarget.dataset.contentdocumentid;
        const fileUrl = `/sfc/servlet.shepherd/document/download/${contentDocumentId}`;
        const link = document.createElement('a');
        link.href = fileUrl;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
    }

    handleEditClick() {
        this.dispatchEvent(new CustomEvent('edit_button_pressed'));
    }

}