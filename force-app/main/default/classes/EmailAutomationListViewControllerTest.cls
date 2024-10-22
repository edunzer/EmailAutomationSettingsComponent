@isTest
public class EmailAutomationListViewControllerTest {

    @testSetup
    static void setupData() {
        // Insert test Email Automation records
        Email_Automation__c emailAutomation1 = new Email_Automation__c(
            Name = 'Automation 1',
            Description__c = 'Description for Automation 1',
            Allow_Self_Registration__c = true,
            Allow_Self_Deregistration__c = false
        );
        Email_Automation__c emailAutomation2 = new Email_Automation__c(
            Name = 'Automation 2',
            Description__c = 'Description for Automation 2',
            Allow_Self_Registration__c = false,
            Allow_Self_Deregistration__c = true
        );
        insert new List<Email_Automation__c>{emailAutomation1, emailAutomation2};

        // Find an active System Administrator user
        Profile sysAdminProfile = [SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
        User testUser = [SELECT Id FROM User WHERE ProfileId = :sysAdminProfile.Id AND IsActive = true LIMIT 1];

        // Insert test Email Recipients
        Email_Recipient__c recipient1 = new Email_Recipient__c(
            Email_Automation__c = emailAutomation1.Id,
            Type__c = 'User',
            User__c = testUser.Id
        );
        Email_Recipient__c recipient2 = new Email_Recipient__c(
            Email_Automation__c = emailAutomation2.Id,
            Type__c = 'Custom',
            Custom_Value__c = 'custom@example.com'
        );
        insert new List<Email_Recipient__c>{recipient1, recipient2};
    }

    @isTest
    static void testGetEmailAutomationsWithRecipients() {
        Test.startTest();
        // Invoke the method to retrieve email automations with recipients
        Map<String, Object> result = EmailAutomationListViewController.getEmailAutomationsWithRecipients();
        Test.stopTest();

        // Retrieve the list of Email Automations
        List<EmailAutomationListViewController.EmailAutomationWrapper> automations = 
            (List<EmailAutomationListViewController.EmailAutomationWrapper>) result.get('emailAutomations');

        // Verify the automations size
        System.assertEquals(2, automations.size(), 'Expected two email automations');

        // Verify that the recipients are associated correctly
        EmailAutomationListViewController.EmailAutomationWrapper firstAutomation = automations[0];
        System.assertNotEquals(null, firstAutomation.userRecipient, 'Expected a recipient for the first automation');
        System.assertEquals('User', firstAutomation.userRecipient.Type__c, 'First automation recipient type mismatch');

        EmailAutomationListViewController.EmailAutomationWrapper secondAutomation = automations[1];
        System.assertNotEquals(null, secondAutomation.userRecipient, 'Expected a recipient for the second automation');
        System.assertEquals('Custom', secondAutomation.userRecipient.Type__c, 'Second automation recipient type mismatch');
    }

    @isTest
    static void testGetEmailAutomationsWithNoRecipients() {
        // Create an email automation without any recipient
        Email_Automation__c emailAutomationNoRecipient = new Email_Automation__c(
            Name = 'Automation No Recipient',
            Description__c = 'Automation with no recipients'
        );
        insert emailAutomationNoRecipient;

        Test.startTest();
        // Invoke the method to retrieve email automations
        Map<String, Object> result = EmailAutomationListViewController.getEmailAutomationsWithRecipients();
        Test.stopTest();

        // Retrieve the list of Email Automations
        List<EmailAutomationListViewController.EmailAutomationWrapper> automations = 
            (List<EmailAutomationListViewController.EmailAutomationWrapper>) result.get('emailAutomations');

        // Verify the automations size and the lack of recipient
        System.assertEquals(3, automations.size(), 'Expected three email automations');
        EmailAutomationListViewController.EmailAutomationWrapper automationNoRecipient = automations[2];
        System.assertEquals(null, automationNoRecipient.userRecipient, 'Expected no recipient for the third automation');
    }
}
