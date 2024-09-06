import { LightningElement, wire, track } from 'lwc';
import getEmailAutomationsWithRecipients from '@salesforce/apex/EmailAutomationListViewController.getEmailAutomationsWithRecipients';
import subscribeUser from '@salesforce/apex/EmailSubscriptionController.subscribeUser';
import unsubscribeUser from '@salesforce/apex/EmailSubscriptionController.unsubscribeUser';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const columns = [
    { label: 'Name', fieldName: 'Name', type: 'text', maxColumnWidth: 600 },  // Use 'Name' (standard field)
    { label: 'Recipient Count', fieldName: 'Recipient_Count__c', type: 'number', initialWidth: 150, maxColumnWidth: 300, cellAttributes: { alignment: 'center' }  },  // Use 'Recipient_Count__c' (custom field)
    { label: 'Allow Self Registration', fieldName: 'Allow_Self_Registration__c', type: 'boolean', initialWidth: 200, maxColumnWidth: 300, cellAttributes: { alignment: 'center' }  },  // Use 'Allow_Self_Registration__c'
    { label: 'Allow Self Deregistration', fieldName: 'Allow_Self_Deregistration__c', type: 'boolean', initialWidth: 200, maxColumnWidth: 300, cellAttributes: { alignment: 'center' }  },  // Use 'Allow_Self_Deregistration__c'
    {
        label: 'Action',
        type: 'button',
        initialWidth: 150,
        maxColumnWidth: 200,
        typeAttributes: {
            label: { fieldName: 'actionLabel' },
            name: 'subscribeUnsubscribe',
            variant: { fieldName: 'buttonVariant' }
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

        console.log('Result data:', data);  // Log the result data for debugging
        console.log('Result error:', error);  // Log the error if any
    
        if (data) {

            console.log('Mapping data to emailAutomations: ', data.emailAutomations);  // Log the email automations being processed

            this.isLoading = false;
            this.emailAutomations = data.emailAutomations.map(wrapper => {
                let actionLabel = 'Subscribe';
                let buttonVariant = 'brand';
    
                if (wrapper.userRecipient) {
                    actionLabel = 'Unsubscribe';
                    buttonVariant = 'destructive';
                }

                console.log('Processed email automation:', wrapper.emailAutomation);  // Log the processed emailAutomation data
    
                return {
                    Id: wrapper.emailAutomation.Id,  // Correctly map the Id field
                    Name: wrapper.emailAutomation.Name,  // Correctly map the Name field
                    Recipient_Count__c: wrapper.emailAutomation.Recipient_Count__c,  // Ensure API field name matches
                    Allow_Self_Registration__c: wrapper.emailAutomation.Allow_Self_Registration__c,  // Ensure correct API name
                    Allow_Self_Deregistration__c: wrapper.emailAutomation.Allow_Self_Deregistration__c,  // Correct API name
                    actionLabel,
                    buttonVariant
                };
            });
            console.log('Final emailAutomations:', this.emailAutomations);  // Log final mapped data

            this.error = undefined;
        } else if (error) {
            console.error('Error in wiredAutomations:', error);  // Log error if it exists
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
