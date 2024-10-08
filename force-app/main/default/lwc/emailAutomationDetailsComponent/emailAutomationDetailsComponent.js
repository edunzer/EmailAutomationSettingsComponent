import { LightningElement, wire, track } from 'lwc';
import { subscribe, MessageContext } from 'lightning/messageService';
import EMAIL_AUTOMATION_MESSAGE_CHANNEL from '@salesforce/messageChannel/EmailAutomationMessageChannel__c';
import getEmailRecipients from '@salesforce/apex/EmailAutomationDetailsController.getEmailRecipients'; 
import getImageForEmailAutomation from '@salesforce/apex/EmailAutomationDetailsController.getImageForEmailAutomation'; 

const recipientColumns = [
    { label: 'Type', fieldName: 'Type__c', type: 'text' },
    { label: 'Value', fieldName: 'Value__c', type: 'text' },
];

export default class EmailAutomationDetailsComponent extends LightningElement {
    @track recordId;
    @track description = 'No description available'; 
    @track recipients = [];
    @track columns = recipientColumns;
    @track imageUrl; // Track the image URL
    @track error;
    @track isImageLoading = false; // Track the loading state for the image

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
        this.description = message.description || 'No description available'; 
        console.log(`Record ID: ${this.recordId}`);
        this.fetchRecipients();
        this.fetchImage();
    }

    // Computed property to check if the description is available
    get descriptionAvailable() {
        return this.description !== 'No description available'; 
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

    // Dynamically compute the recipient count label
    get recipientLabel() {
        return `Recipients (${this.recipients.length})`;
    }

    fetchImage() {
        console.log('Fetching image for recordId:', this.recordId);

        // Ensure loading spinner only shows when recordId is available
        if (this.recordId) {
            this.isImageLoading = true;
            getImageForEmailAutomation({ recordId: this.recordId })
                .then((imageUrl) => {
                    this.imageUrl = imageUrl; // Set the image URL
                    this.isImageLoading = false; // Stop loading spinner
                    console.log('Image URL fetched:', this.imageUrl);
                })
                .catch((error) => {
                    console.error('Error fetching image:', error);
                    this.imageUrl = null; // Clear the image URL if error occurs
                    this.isImageLoading = false; // Stop loading spinner on error
                });
        }
    }
}
