public with sharing class EmailSubscriptionController {

    @AuraEnabled
    public static void subscribeUser(Id emailAutomationId) {
        Id currentUserId = UserInfo.getUserId();

        // Create a new Email Recipient record
        Email_Recipient__c newRecipient = new Email_Recipient__c(
            Email_Automation__c = emailAutomationId,
            Type__c = 'User',
            User__c = currentUserId
        );
        insert newRecipient;
    }

    @AuraEnabled
    public static void unsubscribeUser(Id emailAutomationId) {
        Id currentUserId = UserInfo.getUserId();

        // Query the existing Email Recipient record
        Email_Recipient__c recipientToDelete = [SELECT Id 
                                                FROM Email_Recipient__c 
                                                WHERE Email_Automation__c = :emailAutomationId 
                                                AND User__c = :currentUserId 
                                                LIMIT 1];

        // Delete the Email Recipient record
        delete recipientToDelete;
    }
}
