@isTest
public class EmailSubscriptionControllerTest {

    @testSetup
    static void setupData() {
        // Insert test Email Automation record
        Email_Automation__c emailAutomation = new Email_Automation__c(
            Name = 'Test Automation',
            Description__c = 'Test Automation Description',
            Allow_Self_Registration__c = true,
            Allow_Self_Deregistration__c = true
        );
        insert emailAutomation;

        // Insert test User (System Admin)
        Profile sysAdminProfile = [SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
        User testUser = [SELECT Id FROM User WHERE ProfileId = :sysAdminProfile.Id AND IsActive = true LIMIT 1];

        // Insert Email Recipient for unsubscription test
        Email_Recipient__c recipient = new Email_Recipient__c(
            Email_Automation__c = emailAutomation.Id,
            Type__c = 'User',
            User__c = testUser.Id
        );
        insert recipient;
    }

    @isTest
    static void testSubscribeUser() {
        // Get the Email Automation Id
        Email_Automation__c emailAutomation = [SELECT Id FROM Email_Automation__c LIMIT 1];

        Test.startTest();
        // Call the subscribeUser method
        EmailSubscriptionController.subscribeUser(emailAutomation.Id);
        Test.stopTest();

        // Verify that the subscription was successful
        List<Email_Recipient__c> recipients = [SELECT Id, Email_Automation__c, User__c FROM Email_Recipient__c WHERE Email_Automation__c = :emailAutomation.Id];
        System.assertEquals(2, recipients.size(), 'There should be 2 recipients after subscribing.');
    }

    @isTest
    static void testUnsubscribeUser() {
        // Get the Email Automation Id
        Email_Automation__c emailAutomation = [SELECT Id FROM Email_Automation__c LIMIT 1];

        Test.startTest();
        // Call the unsubscribeUser method
        EmailSubscriptionController.unsubscribeUser(emailAutomation.Id);
        Test.stopTest();

        // Verify that the unsubscription was successful
        List<Email_Recipient__c> remainingRecipients = [SELECT Id FROM Email_Recipient__c WHERE Email_Automation__c = :emailAutomation.Id];
        System.assertEquals(0, remainingRecipients.size(), 'There should be 0 recipients after unsubscribing.');
    }
}
