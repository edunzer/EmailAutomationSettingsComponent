import { LightningElement, api, wire, track } from 'lwc';
import getEmailAutomationWithRecipient from '@salesforce/apex/EmailAutomationComponentController.getEmailAutomationWithRecipient';
import subscribeUser from '@salesforce/apex/EmailSubscriptionController.subscribeUser';
import unsubscribeUser from '@salesforce/apex/EmailSubscriptionController.unsubscribeUser';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class EmailAutomationComponent extends LightningElement {
    @api recordId;
    @track isSubscribed = false;
    @track isLoading = true;
    @track allowSelfRegistration = false;
    @track allowSelfDeregistration = false;
    
    wiredAutomationResult;

    @wire(getEmailAutomationWithRecipient, { recordId: '$recordId' })
    wiredAutomation(result) {
        this.wiredAutomationResult = result;
        const { data, error } = result;

        if (data) {
            this.isLoading = false;
            this.isSubscribed = !!data.userRecipient;  // Check if user is already subscribed
            this.allowSelfRegistration = data.emailAutomation.Allow_Self_Registration__c;  // Set self-registration permission
            this.allowSelfDeregistration = data.emailAutomation.Allow_Self_Deregistration__c;  // Set self-deregistration permission
            this.error = undefined;
        } else if (error) {
            this.isLoading = false;
            this.error = error;
        }
    }

    handleSubscribeUnsubscribe() {
        const action = this.isSubscribed ? unsubscribeUser : subscribeUser;

        action({ emailAutomationId: this.recordId })
            .then(() => {
                const message = this.isSubscribed ? 'Unsubscribed successfully' : 'Subscribed successfully';
                this.isSubscribed = !this.isSubscribed;
                this.showToast('Success', message, 'success');
                return refreshApex(this.wiredAutomationResult);
            })
            .catch(error => {
                this.showToast('Error', 'Error processing subscription: ' + error.body.message, 'error');
            });
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }

    // Dynamically get the class for the button
    get subscribeButtonClass() {
        return `subscribe-button ${this.isSubscribed ? 'unsubscribe' : ''}`;
    }

    get buttonLabel() {
        return this.isSubscribed ? 'Unsubscribe' : 'Subscribe';
    }

    // Disable the button based on the permission fields
    get isButtonDisabled() {
        return (!this.isSubscribed && !this.allowSelfRegistration) || (this.isSubscribed && !this.allowSelfDeregistration);
    }
}
