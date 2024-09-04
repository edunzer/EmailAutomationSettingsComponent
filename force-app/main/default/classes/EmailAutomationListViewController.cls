public with sharing class EmailAutomationListViewController {

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getEmailAutomationsWithRecipients() {
        Id currentUserId = UserInfo.getUserId();

        // Query Email Automation records
        List<Email_Automation__c> emailAutomations = [SELECT Id, Name, Description__c, Recipient_Count__c, Allow_Self_Registration__c, Allow_Self_Deregistration__c
                                                      FROM Email_Automation__c];

        // Collect Email Automation IDs for further processing
        Set<Id> automationIds = new Set<Id>();
        for (Email_Automation__c ea : emailAutomations) {
            automationIds.add(ea.Id);
        }

        // Map to hold Email Recipient records related to the current user
        Map<Id, Email_Recipient__c> recipientMap = new Map<Id, Email_Recipient__c>();
        if (!automationIds.isEmpty()) {
            for (Email_Recipient__c recipient : [SELECT Id, Email_Automation__c, Type__c, User__c
                                                 FROM Email_Recipient__c 
                                                 WHERE User__c = :currentUserId 
                                                 AND Email_Automation__c IN :automationIds]) {
                recipientMap.put(recipient.Email_Automation__c, recipient);
            }
        }

        // Wrap the Email Automations and associate the recipients
        List<EmailAutomationWrapper> automationList = new List<EmailAutomationWrapper>();
        for (Email_Automation__c ea : emailAutomations) {
            Email_Recipient__c userRecipient = recipientMap.get(ea.Id);
            automationList.add(new EmailAutomationWrapper(ea, userRecipient));
        }

        // Prepare the return map
        Map<String, Object> resultMap = new Map<String, Object>();
        resultMap.put('emailAutomations', automationList);

        return resultMap;
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
