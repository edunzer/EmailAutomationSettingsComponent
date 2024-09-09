import { LightningElement, wire, track } from 'lwc';
import { subscribe, MessageContext } from 'lightning/messageService';
import EMAIL_AUTOMATION_MESSAGE_CHANNEL from '@salesforce/messageChannel/EmailAutomationMessageChannel__c';
import getEmailRecipients from '@salesforce/apex/EmailAutomationDetailsController.getEmailRecipients'; // Apex method to fetch recipients

const recipientColumns = [
    { label: 'Recipient Name', fieldName: 'Name', type: 'text' },
    { label: 'Email', fieldName: 'Email', type: 'email' },
];

export default class EmailAutomationDetailsComponent extends LightningElement {
    @track recordId;
    @track description;
    @track recipients = [];
    @track columns = recipientColumns;
    @track error;
    
    subscription = null;

    @wire(MessageContext)
    messageContext;

    // Subscribe to the message channel to receive the selected Email Automation record
    connectedCallback() {
        if (!this.subscription) {
            this.subscription = subscribe(this.messageContext, EMAIL_AUTOMATION_MESSAGE_CHANNEL, (message) => {
                this.handleMessage(message);
            });
        }
    }

    handleMessage(message) {
        this.recordId = message.recordId;
        this.description = message.description;
        this.fetchRecipients();
    }

    fetchRecipients() {
        getEmailRecipients({ emailAutomationId: this.recordId })
            .then((data) => {
                this.recipients = data;
                this.error = undefined;
            })
            .catch((error) => {
                this.recipients = [];
                this.error = error;
            });
    }
}
