import { LightningElement, wire, track } from 'lwc';
import getEmailAutomationsWithRecipients from '@salesforce/apex/EmailAutomationListViewController.getEmailAutomationsWithRecipients';
import subscribeUser from '@salesforce/apex/EmailSubscriptionController.subscribeUser';
import unsubscribeUser from '@salesforce/apex/EmailSubscriptionController.unsubscribeUser';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

// Importing Lightning Message Service (LMS) and the message channel
import { publish, MessageContext } from 'lightning/messageService';
import EMAIL_AUTOMATION_MESSAGE_CHANNEL from '@salesforce/messageChannel/EmailAutomationMessageChannel__c'; // Import your message channel

const columns = [
    { label: 'Email Name', fieldName: 'Name', type: 'text' },
    { label: 'Recipients', fieldName: 'Recipient_Count__c', type: 'number', initialWidth: 120, maxColumnWidth: 300, cellAttributes: { alignment: 'center' } },
    { label: 'Registration Allowed', fieldName: 'Allow_Self_Registration__c', type: 'boolean', initialWidth: 180, maxColumnWidth: 300, cellAttributes: { alignment: 'center' } },
    { label: 'Deregistration Allowed', fieldName: 'Allow_Self_Deregistration__c', type: 'boolean', initialWidth: 180, maxColumnWidth: 300, cellAttributes: { alignment: 'center' } },
    {
        label: 'Action',
        type: 'button',
        initialWidth: 120,
        maxColumnWidth: 200,
        typeAttributes: {
            label: { fieldName: 'actionLabel' },
            name: 'subscribeUnsubscribe',
            variant: { fieldName: 'buttonVariant' },
            disabled: { fieldName: 'buttonDisabled' }
        }
    }
];

export default class EmailAutomationListViewComponent extends LightningElement {
    @track emailAutomations = [];
    @track paginatedEmailAutomations = [];
    @track columns = columns;
    @track selectedRows = [];  // Track selected row
    @track error;
    @track isLoading = true;

    // Pagination variables
    @track currentPage = 1;
    @track pageSize = 15; // Number of records per page
    @track totalPages = 0;

    wiredAutomationsResult;

    @wire(MessageContext)
    messageContext;  // Required to send messages via LMS

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
                    buttonDisabled = !wrapper.emailAutomation.Allow_Self_Deregistration__c;
                } else {
                    buttonDisabled = !wrapper.emailAutomation.Allow_Self_Registration__c;
                }

                return {
                    Id: wrapper.emailAutomation.Id,
                    Name: wrapper.emailAutomation.Name,
                    Description__c: wrapper.emailAutomation.Description__c, // Add description field
                    Recipient_Count__c: wrapper.emailAutomation.Recipient_Count__c,
                    Allow_Self_Registration__c: wrapper.emailAutomation.Allow_Self_Registration__c,
                    Allow_Self_Deregistration__c: wrapper.emailAutomation.Allow_Self_Deregistration__c,
                    actionLabel,
                    buttonVariant,
                    buttonDisabled
                };
            });

            // Initialize pagination
            this.totalPages = Math.ceil(this.emailAutomations.length / this.pageSize);
            this.updatePaginatedData();
            this.error = undefined;
        } else if (error) {
            this.isLoading = false;
            this.error = error;
            this.emailAutomations = [];
        }
    }

    // Handle row selection
    handleRowSelection(event) {
        const selectedRows = event.detail.selectedRows;
        this.selectedRows = selectedRows;  // Track the selected row

        if (selectedRows.length > 0) {
            const selectedEmailAutomation = selectedRows[0];  // Single selection
            const payload = {
                recordId: selectedEmailAutomation.Id,
                description: selectedEmailAutomation.Description__c
            };
            publish(this.messageContext, EMAIL_AUTOMATION_MESSAGE_CHANNEL, payload);
        }
    }

    // Update the paginated data for the current page
    updatePaginatedData() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.paginatedEmailAutomations = this.emailAutomations.slice(startIndex, endIndex);
    }

    // Go to the next page
    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage += 1;
            this.updatePaginatedData();
        }
    }

    // Go to the previous page
    handlePreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage -= 1;
            this.updatePaginatedData();
        }
    }

    // Subscribe/unsubscribe logic for button clicks
    handleRowAction(event) {
        const selectedEmailAutomation = event.detail.row;
        const actionName = event.detail.action.name;
        const emailAutomationId = selectedEmailAutomation.Id;

        if (actionName === 'subscribeUnsubscribe') {
            const isSubscribed = selectedEmailAutomation.actionLabel === 'Unsubscribe';
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

    // Dynamically control next/previous button states
    get disablePrevious() {
        return this.currentPage === 1;
    }

    get disableNext() {
        return this.currentPage === this.totalPages;
    }
}
