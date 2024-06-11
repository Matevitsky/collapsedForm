public with sharing class FileUploadController {
    @AuraEnabled
    public static List<ContentDocumentLinkWrapper> getFiles(Id accountId) {
        List<ContentDocumentLinkWrapper> fileWrappers = new List<ContentDocumentLinkWrapper>();

        for (ContentDocumentLink link : [
                SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.LatestPublishedVersionId
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :accountId
        ]) {
            ContentDocumentLinkWrapper wrapper =   new ContentDocumentLinkWrapper();
            wrapper.ContentDocumentId = link.ContentDocumentId;
            wrapper.Title = link.ContentDocument.Title;
            wrapper.LatestPublishedVersionId = link.ContentDocument.LatestPublishedVersionId;
            fileWrappers.add(wrapper);
        }
        return fileWrappers;
    }

    public class ContentDocumentLinkWrapper {
        @AuraEnabled public String ContentDocumentId { get; set; }
        @AuraEnabled public String Title { get; set; }
        @AuraEnabled public String LatestPublishedVersionId { get; set; }
    }
}
