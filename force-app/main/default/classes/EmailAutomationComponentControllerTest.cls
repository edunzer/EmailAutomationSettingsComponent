@isTest
public class EmailAutomationComponentControllerTest {

    @testSetup
    static void setupData() {
        // Insert test Email Automation record
        Email_Automation__c emailAutomation = new Email_Automation__c(
            Name = 'Test Automation', 
            Description__c = 'Test Automation Description', 
            Allow_Self_Registration__c = true, 
            Allow_Self_Deregistration__c = false
        );
        insert emailAutomation;

        // Find an active System Administrator user
        Profile sysAdminProfile = [SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
        User testUser = [SELECT Id FROM User WHERE ProfileId = :sysAdminProfile.Id AND IsActive = true LIMIT 1];

        // Insert test Email Recipient for the user
        Email_Recipient__c emailRecipient = new Email_Recipient__c(
            Email_Automation__c = emailAutomation.Id, 
            Type__c = 'User', 
            User__c = testUser.Id
        );
        insert emailRecipient;
    }

    @isTest
    static void testGetEmailAutomationWithRecipient_Success() {
        Email_Automation__c emailAutomation = [SELECT Id FROM Email_Automation__c LIMIT 1];
        User testUser = [SELECT Id FROM User WHERE Profile.Name = 'System Administrator' AND IsActive = true LIMIT 1];

        Test.startTest();
        System.runAs(testUser) { 
            EmailAutomationComponentController.EmailAutomationWrapper result = EmailAutomationComponentController.getEmailAutomationWithRecipient(emailAutomation.Id);
            System.assertNotEquals(null, result, 'Result should not be null');
            System.assertEquals(emailAutomation.Id, result.emailAutomation.Id, 'EmailAutomation Id mismatch');
            System.assertNotEquals(null, result.userRecipient, 'UserRecipient should not be null');
            System.assertEquals(testUser.Id, result.userRecipient.User__c, 'UserRecipient User__c should match the test user');
        }
        Test.stopTest();
    }

    @isTest
    static void testGetEmailAutomationWithRecipient_RecordIdNull() {
        Test.startTest();
        try {
            EmailAutomationComponentController.getEmailAutomationWithRecipient(null);
            System.assert(false, 'Expected AuraHandledException for null recordId');
        } catch (AuraHandledException e) {
            System.assertEquals('Script-thrown exception', e.getMessage(), 'Unexpected exception message.');
        } catch (Exception ex) {
            System.assert(false, 'Unexpected exception thrown: ' + ex.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testGetEmailAutomationWithRecipient_NoRecipient() {
        Email_Automation__c emailAutomation = [SELECT Id FROM Email_Automation__c LIMIT 1];

        Profile sysAdminProfile = [SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
        User testUserWithoutRecipient = [SELECT Id FROM User WHERE ProfileId = :sysAdminProfile.Id AND IsActive = true LIMIT 1];

        delete [SELECT Id FROM Email_Recipient__c WHERE User__c = :testUserWithoutRecipient.Id];

        Test.startTest();
        System.runAs(testUserWithoutRecipient) {
            EmailAutomationComponentController.EmailAutomationWrapper result = EmailAutomationComponentController.getEmailAutomationWithRecipient(emailAutomation.Id);
            System.assertNotEquals(null, result);
            System.assertEquals(emailAutomation.Id, result.emailAutomation.Id);
            System.assertEquals(null, result.userRecipient); // No recipient for this user
        }
        Test.stopTest();
    }

    @isTest
    static void testGetEmailAutomationWithRecipient_QueryException() {
        // Using an invalid ID, but properly formatted
        Id invalidId = 'aKl000000000001AAA'; 
        
        Test.startTest();
        try {
            EmailAutomationComponentController.getEmailAutomationWithRecipient(invalidId);
            System.assert(false, 'Expected AuraHandledException for invalid recordId');
        } catch (AuraHandledException e) {
            System.debug('Actual exception message: ' + e.getMessage());
            System.assertEquals('Unable to find the requested record. Please check the record ID.', e.getMessage(), 'Unexpected exception message.');
        } catch (Exception ex) {
            System.assert(false, 'Unexpected exception thrown: ' + ex.getMessage());
        }
        Test.stopTest();
    }      
}
