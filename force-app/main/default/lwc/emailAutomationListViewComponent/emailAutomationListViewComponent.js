import { LightningElement, wire, track } from 'lwc';
import getEmailAutomationsWithRecipients from '@salesforce/apex/EmailAutomationListViewController.getEmailAutomationsWithRecipients';
import subscribeUser from '@salesforce/apex/EmailSubscriptionController.subscribeUser';
import unsubscribeUser from '@salesforce/apex/EmailSubscriptionController.unsubscribeUser';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { publish, MessageContext } from 'lightning/messageService';
import EMAIL_AUTOMATION_MESSAGE_CHANNEL from '@salesforce/messageChannel/EmailAutomationMessageChannel__c';

const columns = [
    { label: 'Email Name', fieldName: 'Email_Name__c', type: 'text' },
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
    @track filteredEmailAutomations = [];
    @track columns = columns;
    @track selectedRows = [];
    @track error;
    @track isLoading = true;
    @track searchTerm = '';

    // Pagination variables
    @track currentPage = 1;
    @track pageSize = 10;
    @track totalPages = 0;

    wiredAutomationsResult;

    @wire(MessageContext)
    messageContext;

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

                if (wrapper.userRecipient) {
                    actionLabel = 'Unsubscribe';
                    buttonVariant = 'destructive';
                    buttonDisabled = !wrapper.emailAutomation.Allow_Self_Deregistration__c;
                } else {
                    buttonDisabled = !wrapper.emailAutomation.Allow_Self_Registration__c;
                }

                return {
                    Id: wrapper.emailAutomation.Id,
                    Email_Name__c: wrapper.emailAutomation.Email_Name__c,
                    Description__c: wrapper.emailAutomation.Description__c,
                    Recipient_Count__c: wrapper.emailAutomation.Recipient_Count__c,
                    Allow_Self_Registration__c: wrapper.emailAutomation.Allow_Self_Registration__c,
                    Allow_Self_Deregistration__c: wrapper.emailAutomation.Allow_Self_Deregistration__c,
                    actionLabel,
                    buttonVariant,
                    buttonDisabled
                };
            });

            this.filteredEmailAutomations = this.emailAutomations;
            this.calculateTotalPages();
            this.updatePaginatedData();
            this.error = undefined;
        } else if (error) {
            this.isLoading = false;
            this.error = error;
            this.emailAutomations = [];
        }
    }

    // Calculate total pages based on filtered data
    calculateTotalPages() {
        this.totalPages = Math.ceil(this.filteredEmailAutomations.length / this.pageSize);
    }

    // Handle search input change
    handleSearchChange(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.filterEmailAutomations();
    }

    // Filter email automations based on search term and recalculate pagination
    filterEmailAutomations() {
        if (this.searchTerm) {
            this.filteredEmailAutomations = this.emailAutomations.filter(automation =>
                automation.Email_Name__c && automation.Email_Name__c.toLowerCase().includes(this.searchTerm)
            );
            this.currentPage = Math.min(this.currentPage, Math.ceil(this.filteredEmailAutomations.length / this.pageSize) || 1); // Revalidate the current page
        } else {
            this.filteredEmailAutomations = [...this.emailAutomations]; // Reset to full list
        }
    
        this.calculateTotalPages();
        this.updatePaginatedData();
    } 

    // Update the paginated data for the current page
    updatePaginatedData() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.paginatedEmailAutomations = this.filteredEmailAutomations.slice(startIndex, endIndex);
    }

    // Handle row selection
    handleRowSelection(event) {
        const selectedRows = event.detail.selectedRows;
        this.selectedRows = selectedRows;

        if (selectedRows.length > 0) {
            const selectedEmailAutomation = selectedRows[0];
            const payload = {
                recordId: selectedEmailAutomation.Id,
                description: selectedEmailAutomation.Description__c
            };
            publish(this.messageContext, EMAIL_AUTOMATION_MESSAGE_CHANNEL, payload);
        }
    }

    // Handle pagination actions
    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage += 1;
            this.updatePaginatedData();
        }
    }

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
    
        console.log(`Starting subscription action for record: ${emailAutomationId}, Subscribed: ${isSubscribed}`);
    
        action({ emailAutomationId })
            .then(() => {
                const message = isSubscribed ? 'Unsubscribed successfully' : 'Subscribed successfully';
                this.showToast('Success', message, 'success');
                
                // After refresh, maintain current page and reapply the filter
                return refreshApex(this.wiredAutomationsResult).then(() => {
                    console.log('Data refreshed, reapplying filter and current page');
                    this.filterEmailAutomations(); // Reapply filter to the updated data
                    this.reapplyCurrentPage(); // Apply pagination logic based on the filtered data
                });
            })
            .catch(error => {
                console.error('Error processing subscription:', error.body.message);
                this.showToast('Error', 'Error processing subscription: ' + error.body.message, 'error');
            });
    }
    
    reapplyCurrentPage() {
        const totalRecords = this.filteredEmailAutomations.length;
        const maxPage = Math.ceil(totalRecords / this.pageSize);
    
        console.log(`Total Records: ${totalRecords}, Max Page: ${maxPage}, Current Page: ${this.currentPage}`);
    
        if (this.currentPage > maxPage) {
            console.log(`Adjusting current page from ${this.currentPage} to ${maxPage} due to reduced records.`);
            this.currentPage = maxPage || 1;  // Ensure the current page is valid and fallback to page 1 if maxPage is 0
        }
    
        console.log(`Current page after reapplying: ${this.currentPage}`);
        this.updatePaginatedData();
    }
           

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }

    // Pagination button states
    get disablePrevious() {
        return this.currentPage === 1;
    }

    get disableNext() {
        return this.currentPage === this.totalPages || this.totalPages === 0;
    }
}
