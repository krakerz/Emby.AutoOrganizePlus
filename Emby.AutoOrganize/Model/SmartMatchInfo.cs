
using System;
using System.Collections.Generic;

namespace Emby.AutoOrganizePlus.Model
{
    public class SmartMatchInfo
    {
        public string ItemName { get; set; }
        public string DisplayName { get; set; }
        public FileOrganizerType OrganizerType { get; set; }
        public string[] MatchStrings { get; set; }

        public SmartMatchInfo()
        {
            MatchStrings = new string[] { };
        }
    }
}
