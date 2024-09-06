import { LightningElement, wire, track } from 'lwc';
import getEmailAutomationsWithRecipients from '@salesforce/apex/EmailAutomationListViewController.getEmailAutomationsWithRecipients';
import subscribeUser from '@salesforce/apex/EmailSubscriptionController.subscribeUser';
import unsubscribeUser from '@salesforce/apex/EmailSubscriptionController.unsubscribeUser';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const columns = [
    { label: 'Name', fieldName: 'Name', type: 'text'},
    { label: 'Recipient Count', fieldName: 'Recipient_Count__c', type: 'number', initialWidth: 150, maxColumnWidth: 300, cellAttributes: { alignment: 'center' } },
    { label: 'Allow Self Registration', fieldName: 'Allow_Self_Registration__c', type: 'boolean', initialWidth: 200, maxColumnWidth: 300, cellAttributes: { alignment: 'center' } },
    { label: 'Allow Self Deregistration', fieldName: 'Allow_Self_Deregistration__c', type: 'boolean', initialWidth: 200, maxColumnWidth: 300, cellAttributes: { alignment: 'center' } },
    {
        label: 'Action',
        type: 'button',
        initialWidth: 150,
        maxColumnWidth: 200,
        typeAttributes: {
            label: { fieldName: 'actionLabel' },
            name: 'subscribeUnsubscribe',
            variant: { fieldName: 'buttonVariant' },
            disabled: { fieldName: 'buttonDisabled' }  // Disable button based on registration/deregistration field values
        }
    }
];


export default class EmailAutomationListViewComponent extends LightningElement {
    @track emailAutomations = [];
    @track columns = columns;
    @track error;
    @track isLoading = true;

    wiredAutomationsResult;

    @wire(getEmailAutomationsWithRecipients)
    wiredAutomations(result) {
        this.wiredAutomationsResult = result;
        const { data, error } = result;

        if (data) {
            this.isLoading = false;
            this.emailAutomations = data.emailAutomations.map(wrapper => {
                let actionLabel = 'Subscribe';
                let buttonVariant = 'brand';
                let buttonDisabled = false;

                // Check if user is subscribed
                if (wrapper.userRecipient) {
                    actionLabel = 'Unsubscribe';
                    buttonVariant = 'destructive';
                    // Disable Unsubscribe button if Allow_Self_Deregistration__c is false
                    buttonDisabled = !wrapper.emailAutomation.Allow_Self_Deregistration__c;
                } else {
                    // Disable Subscribe button if Allow_Self_Registration__c is false
                    buttonDisabled = !wrapper.emailAutomation.Allow_Self_Registration__c;
                }

                return {
                    Id: wrapper.emailAutomation.Id,
                    Name: wrapper.emailAutomation.Name,
                    Recipient_Count__c: wrapper.emailAutomation.Recipient_Count__c,
                    Allow_Self_Registration__c: wrapper.emailAutomation.Allow_Self_Registration__c,
                    Allow_Self_Deregistration__c: wrapper.emailAutomation.Allow_Self_Deregistration__c,
                    actionLabel,
                    buttonVariant,
                    buttonDisabled  // Added the buttonDisabled property
                };
            });

            this.error = undefined;
        } else if (error) {
            this.isLoading = false;
            this.error = error;
            this.emailAutomations = [];
        }
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const emailAutomationId = event.detail.row.Id;

        if (actionName === 'subscribeUnsubscribe') {
            const isSubscribed = event.detail.row.actionLabel === 'Unsubscribe';
            this.handleSubscribeUnsubscribe(emailAutomationId, isSubscribed);
        }
    }

    handleSubscribeUnsubscribe(emailAutomationId, isSubscribed) {
        const action = isSubscribed ? unsubscribeUser : subscribeUser;

        action({ emailAutomationId })
            .then(() => {
                const message = isSubscribed ? 'Unsubscribed successfully' : 'Subscribed successfully';
                this.showToast('Success', message, 'success');
                return refreshApex(this.wiredAutomationsResult);
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
}

