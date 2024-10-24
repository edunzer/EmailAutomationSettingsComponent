public with sharing class EmailAutomationComponentController {

    @AuraEnabled(cacheable=true)
    public static EmailAutomationWrapper getEmailAutomationWithRecipient(Id recordId) {
        Id currentUserId = UserInfo.getUserId();
        System.debug('Running getEmailAutomationWithRecipient...');
        System.debug('Record ID: ' + recordId);
        System.debug('Current User ID: ' + currentUserId);

        // Check if recordId is null
        if (recordId == null) {
            System.debug('Record ID is null.');
            throw new AuraHandledException('Record ID is null. Cannot fetch Email Automation.');
        }

        try {
            // Query to get the Email Automation record based on recordId
            List<Email_Automation__c> emailAutomationList = [SELECT Id, Name, Description__c, Recipient_Count__c, Allow_Self_Registration__c, Allow_Self_Deregistration__c 
                                   FROM Email_Automation__c 
                                   WHERE Id = :recordId 
                                   LIMIT 1];
            if (emailAutomationList.isEmpty()) {
                // Explicitly handle case where no records are found
                throw new AuraHandledException('Unable to find the requested record. Please check the record ID.');
            }

            Email_Automation__c emailAutomation = emailAutomationList[0];
            System.debug('Email Automation record found: ' + emailAutomation.Id);

            // Query to get the recipient associated with the current user for this email automation
            Email_Recipient__c userRecipient = null;
            try {
                userRecipient = [
                    SELECT Id, Email_Automation__c, Type__c, User__c 
                    FROM Email_Recipient__c 
                    WHERE Email_Automation__c = :emailAutomation.Id 
                    AND User__c = :currentUserId 
                    LIMIT 1
                ];
                System.debug('Email Recipient found: ' + userRecipient.Id);
            } catch (QueryException qe) {
                System.debug('No recipient found for user.');
                // Setting userRecipient to null if no recipient found
                userRecipient = null;
            }

            // Wrap the Email Automation and associated recipient in an EmailAutomationWrapper
            EmailAutomationWrapper automationWrapper = new EmailAutomationWrapper(emailAutomation, userRecipient);

            return automationWrapper;

        } catch (Exception e) {
            // Check if it's an AuraHandledException and re-throw if so
            if (e instanceof AuraHandledException) {
                throw (AuraHandledException) e;
            }
            // For any other exceptions, throw a generic user-friendly message
            System.debug('Error in getEmailAutomationWithRecipient: ' + e.getMessage());
            throw new AuraHandledException('An error occurred while fetching email automation details.');
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
