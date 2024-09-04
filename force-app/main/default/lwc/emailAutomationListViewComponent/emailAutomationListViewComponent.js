import { LightningElement, wire, track } from 'lwc';
import getEmailAutomationsWithRecipients from '@salesforce/apex/EmailAutomationListViewController.getEmailAutomationsWithRecipients';
import subscribeUser from '@salesforce/apex/EmailSubscriptionController.subscribeUser';
import unsubscribeUser from '@salesforce/apex/EmailSubscriptionController.unsubscribeUser';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const columns = [
    { label: 'Name', fieldName: 'name', type: 'text' },
    { label: 'Description', fieldName: 'description', type: 'text' },
    { label: 'Recipient Count', fieldName: 'recipientCount', type: 'number' },
    { label: 'Allow Self Registration', fieldName: 'allowSelfRegistration', type: 'boolean' },
    { label: 'Allow Self Deregistration', fieldName: 'allowSelfDeregistration', type: 'boolean' },
    {
        label: 'Action',
        type: 'button',
        initialWidth: 100,
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

        if (data) {
            this.isLoading = false;
            this.emailAutomations = data.emailAutomations.map(wrapper => {
                let actionLabel = 'Subscribe';
                let buttonVariant = 'brand';

                if (wrapper.userRecipient) {
                    actionLabel = 'Unsubscribe';
                    buttonVariant = 'destructive';
                }

                return {
                    ...wrapper.emailAutomation,
                    actionLabel,
                    buttonVariant
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
