import { LightningElement, wire, track } from 'lwc';
import { subscribe, MessageContext } from 'lightning/messageService';
import EMAIL_AUTOMATION_MESSAGE_CHANNEL from '@salesforce/messageChannel/EmailAutomationMessageChannel__c';
import getEmailRecipients from '@salesforce/apex/EmailAutomationDetailsController.getEmailRecipients'; // Apex method to fetch recipients

const recipientColumns = [
    { label: 'Type', fieldName: 'Type__c', type: 'text' },
    { label: 'Value', fieldName: 'Value__c', type: 'text' },
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
        console.log('Component initialized. Subscribing to message channel...');
        if (!this.subscription) {
            this.subscription = subscribe(this.messageContext, EMAIL_AUTOMATION_MESSAGE_CHANNEL, (message) => {
                console.log('Message received from EmailAutomationMessageChannel:', message);
                this.handleMessage(message);
            });
        }
    }

    handleMessage(message) {
        console.log('Handling message:', message);
        this.recordId = message.recordId;
        this.description = message.description;
        console.log(`Record ID: ${this.recordId}, Description: ${this.description}`);
        this.fetchRecipients();
    }

    fetchRecipients() {
        console.log('Fetching recipients for recordId:', this.recordId);
        getEmailRecipients({ emailAutomationId: this.recordId })
            .then((data) => {
                console.log('Recipients fetched successfully:', data);
                this.recipients = data;
                this.error = undefined;
            })
            .catch((error) => {
                console.error('Error fetching recipients:', error);
                this.recipients = [];
                this.error = error;
            });
    }
}
