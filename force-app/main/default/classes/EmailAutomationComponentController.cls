public with sharing class EmailAutomationComponentController {

    @AuraEnabled(cacheable=true)
    public static EmailAutomationWrapper getEmailAutomationWithRecipient(Id recordId) {
        Id currentUserId = UserInfo.getUserId();

        // Check if recordId is null
        if (recordId == null) {
            throw new AuraHandledException('Record ID is null. Cannot fetch Email Automation.');
        }

        try {
            // Query to get the Email Automation record based on recordId
            Email_Automation__c emailAutomation = [SELECT Id, Name, Description__c, Recipient_Count__c, Allow_Self_Registration__c, Allow_Self_Deregistration__c 
                                                   FROM Email_Automation__c 
                                                   WHERE Id = :recordId 
                                                   LIMIT 1];

            // Query to get the recipient associated with the current user for this email automation
            Email_Recipient__c userRecipient;
            try {
                userRecipient = [SELECT Id, Email_Automation__c, Type__c, User__c 
                                 FROM Email_Recipient__c 
                                 WHERE Email_Automation__c = :emailAutomation.Id 
                                 AND User__c = :currentUserId 
                                 LIMIT 1];
            } catch (Exception e) {
                userRecipient = null; // If no recipient found, set it to null
            }

            // Wrap the Email Automation and associated recipient in an EmailAutomationWrapper
            EmailAutomationWrapper automationWrapper = new EmailAutomationWrapper(emailAutomation, userRecipient);

            return automationWrapper;

        } catch (Exception e) {
            // Log the error and throw a handled exception to the client
            System.debug('Error in getEmailAutomationWithRecipient: ' + e.getMessage());
            throw new AuraHandledException('Error in getEmailAutomationWithRecipient: ' + e.getMessage());
        }
    }

    // Wrapper class to return Email Automation and associated Email Recipient
    public class EmailAutomationWrapper {
        @AuraEnabled public Email_Automation__c emailAutomation { get; set; }
        @AuraEnabled public Email_Recipient__c userRecipient { get; set; }

        public EmailAutomationWrapper(Email_Automation__c emailAutomation, Email_Recipient__c userRecipient) {
            this.emailAutomation = emailAutomation;
            this.userRecipient = userRecipient;
        }
    }
}
