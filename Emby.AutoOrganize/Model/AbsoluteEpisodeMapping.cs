using System;
using System.Collections.Generic;
using System.Linq;

namespace Emby.AutoOrganizePlus.Model
{
    /// <summary>
    /// Maps absolute-numbered file names (no season, e.g. "[ASW] Anime 13") onto a series' seasons.
    /// </summary>
    public class AbsoluteEpisodeMapping
    {
        public Guid Id { get; set; }

        /// <summary>
        /// Library series id. Empty when the rule was remembered for a series that wasn't in the library yet.
        /// </summary>
        public string SeriesId { get; set; }

        public string SeriesName { get; set; }

        /// <summary>
        /// Series names as parsed from file names, compared case-insensitively.
        /// </summary>
        public List<string> MatchStrings { get; set; }

        public List<AbsoluteEpisodeRange> Ranges { get; set; }

        public AbsoluteEpisodeMapping()
        {
            Id = Guid.NewGuid();
            MatchStrings = new List<string>();
            Ranges = new List<AbsoluteEpisodeRange>();
        }

        /// <summary>
        /// The range covering an absolute episode number: the one with the highest FromEpisode not above it.
        /// </summary>
        public AbsoluteEpisodeRange GetRange(int absoluteEpisode)
        {
            return Ranges
                .Where(i => i.FromEpisode <= absoluteEpisode)
                .OrderByDescending(i => i.FromEpisode)
                .FirstOrDefault();
        }
    }

    public class AbsoluteEpisodeRange
    {
        /// <summary>
        /// First absolute (file) episode number of this range.
        /// </summary>
        public int FromEpisode { get; set; }

        public int SeasonNumber { get; set; }

        /// <summary>
        /// In-season episode number that FromEpisode maps to; 1 restarts numbering, higher values continue it.
        /// </summary>
        public int StartAt { get; set; } = 1;

        public int Map(int absoluteEpisode)
        {
            return StartAt + absoluteEpisode - FromEpisode;
        }
    }
}
