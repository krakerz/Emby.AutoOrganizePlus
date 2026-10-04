using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Emby.AutoOrganizePlus.Core;
using Emby.AutoOrganizePlus.Model;
using MediaBrowser.Controller.Net;
using MediaBrowser.Model.Dto;
using MediaBrowser.Model.Querying;
using MediaBrowser.Model.Serialization;
using MediaBrowser.Model.Services;
using MediaBrowser.Model.Entities;

namespace Emby.AutoOrganizePlus.Api
{
    [Route("/Library/AutoOrganizePlus/FileOrganization", "GET", Summary = "Gets file organization results")]
    public class GetFileOrganizationActivity : IReturn<QueryResult<FileOrganizationResult>>
    {
        /// <summary>
        /// Skips over a given number of items within the results. Use for paging.
        /// </summary>
        /// <value>The start index.</value>
        [ApiMember(Name = "StartIndex", Description = "Optional. The record index to start at. All items with a lower index will be dropped from the results.", IsRequired = false, DataType = "int", ParameterType = "query", Verb = "GET")]
        public int? StartIndex { get; set; }

        /// <summary>
        /// The maximum number of items to return
        /// </summary>
        /// <value>The limit.</value>
        [ApiMember(Name = "Limit", Description = "Optional. The maximum number of records to return", IsRequired = false, DataType = "int", ParameterType = "query", Verb = "GET")]
        public int? Limit { get; set; }
    }

    [Route("/Library/AutoOrganizePlus/FileOrganizations", "DELETE", Summary = "Clears the activity log")]
    public class ClearOrganizationLog : IReturnVoid
    {
    }

    [Route("/Library/AutoOrganizePlus/FileOrganizations/Completed", "DELETE", Summary = "Clears the activity log")]
    public class ClearOrganizationCompletedLog : IReturnVoid
    {
    }

    [Route("/Library/AutoOrganizePlus/FileOrganizations/{Id}/File", "DELETE", Summary = "Deletes the original file of a organizer result")]
    public class DeleteOriginalFile : IReturnVoid
    {
        /// <summary>
        /// Gets or sets the id.
        /// </summary>
        /// <value>The id.</value>
        [ApiMember(Name = "Id", Description = "Result Id", IsRequired = true, DataType = "string", ParameterType = "path", Verb = "DELETE")]
        public string Id { get; set; }
    }

    [Route("/Library/AutoOrganizePlus/FileOrganizations/{Id}/Organize", "POST", Summary = "Performs an organization")]
    public class PerformOrganization : IReturn<QueryResult<FileOrganizationResult>>
    {
        /// <summary>
        /// Gets or sets the id.
        /// </summary>
        /// <value>The id.</value>
        [ApiMember(Name = "Id", Description = "Result Id", IsRequired = true, DataType = "string", ParameterType = "path", Verb = "POST")]
        public string Id { get; set; }
    }

    [Route("/Library/AutoOrganizePlus/FileOrganizations/{Id}/Episode/Organize", "POST", Summary = "Performs organization of a tv episode")]
    public class OrganizeEpisode
    {
        [ApiMember(Name = "Id", Description = "Result Id", IsRequired = true, DataType = "string", ParameterType = "path", Verb = "POST")]
        public string Id { get; set; }

        [ApiMember(Name = "SeriesId", Description = "Series Id", IsRequired = true, DataType = "string", ParameterType = "query", Verb = "POST")]
        public string SeriesId { get; set; }

        [ApiMember(Name = "SeasonNumber", IsRequired = true, DataType = "int", ParameterType = "query", Verb = "POST")]
        public int SeasonNumber { get; set; }

        [ApiMember(Name = "EpisodeNumber", IsRequired = true, DataType = "int", ParameterType = "query", Verb = "POST")]
        public int EpisodeNumber { get; set; }

        [ApiMember(Name = "EndingEpisodeNumber", IsRequired = false, DataType = "int", ParameterType = "query", Verb = "POST")]
        public int? EndingEpisodeNumber { get; set; }

        [ApiMember(Name = "RememberCorrection", Description = "Whether or not to apply the same correction to future episodes of the same series.", IsRequired = false, DataType = "bool", ParameterType = "query", Verb = "POST")]
        public bool RememberCorrection { get; set; }

        [ApiMember(Name = "RememberAbsoluteMapping", Description = "Whether or not to remember this absolute episode number to season/episode mapping for future files of the same name.", IsRequired = false, DataType = "bool", ParameterType = "query", Verb = "POST")]
        public bool RememberAbsoluteMapping { get; set; }

        [ApiMember(Name = "NewSeriesProviderIds", Description = "A list of provider IDs identifying a new series.", IsRequired = false, DataType = "Dictionary<string, string>", ParameterType = "query", Verb = "POST")]
        public ProviderIdDictionary NewSeriesProviderIds { get; set; }

        [ApiMember(Name = "NewSeriesName", Description = "Name of a series to add.", IsRequired = false, DataType = "string", ParameterType = "query", Verb = "POST")]
        public string NewSeriesName { get; set; }

        [ApiMember(Name = "NewSeriesYear", Description = "Year of a series to add.", IsRequired = false, DataType = "string", ParameterType = "query", Verb = "POST")]
        public int? NewSeriesYear { get; set; }

        [ApiMember(Name = "TargetFolder", Description = "Target Folder", IsRequired = false, DataType = "string", ParameterType = "query", Verb = "POST")]
        public string TargetFolder { get; set; }
    }

    [Route("/Library/AutoOrganizePlus/FileOrganizations/{Id}/Movie/Organize", "POST", Summary = "Performs organization of a movie")]
    public class OrganizeMovie
    {
        [ApiMember(Name = "Id", Description = "Result Id", IsRequired = true, DataType = "string", ParameterType = "path", Verb = "POST")]
        public string Id { get; set; }

        [ApiMember(Name = "MovieId", Description = "Movie Id", IsRequired = true, DataType = "string", ParameterType = "query", Verb = "POST")]
        public string MovieId { get; set; }

        [ApiMember(Name = "NewMovieProviderIds", Description = "A list of provider IDs identifying a new movie.", IsRequired = false, DataType = "Dictionary<string, string>", ParameterType = "query", Verb = "POST")]
        public ProviderIdDictionary NewMovieProviderIds { get; set; }

        [ApiMember(Name = "NewMovieName", Description = "Name of a movie to add.", IsRequired = false, DataType = "string", ParameterType = "query", Verb = "POST")]
        public string NewMovieName { get; set; }

        [ApiMember(Name = "NewMovieYear", Description = "Year of a movie to add.", IsRequired = false, DataType = "string", ParameterType = "query", Verb = "POST")]
        public int? NewMovieYear { get; set; }

        [ApiMember(Name = "TargetFolder", Description = "Target Folder", IsRequired = false, DataType = "string", ParameterType = "query", Verb = "POST")]
        public string TargetFolder { get; set; }
    }

    [Route("/Library/AutoOrganizePlus/FileOrganizations/SmartMatches", "GET", Summary = "Gets smart match entries")]
    public class GetSmartMatchInfos : IReturn<QueryResult<SmartMatchInfo>>
    {
        /// <summary>
        /// Skips over a given number of items within the results. Use for paging.
        /// </summary>
        /// <value>The start index.</value>
        [ApiMember(Name = "StartIndex", Description = "Optional. The record index to start at. All items with a lower index will be dropped from the results.", IsRequired = false, DataType = "int", ParameterType = "query", Verb = "GET")]
        public int? StartIndex { get; set; }

        /// <summary>
        /// The maximum number of items to return
        /// </summary>
        /// <value>The limit.</value>
        [ApiMember(Name = "Limit", Description = "Optional. The maximum number of records to return", IsRequired = false, DataType = "int", ParameterType = "query", Verb = "GET")]
        public int? Limit { get; set; }
    }

    [Route("/Library/AutoOrganizePlus/FileOrganizations/SmartMatches/Delete", "POST", Summary = "Deletes a smart match entry")]
    public class DeleteSmartMatchEntry
    {
        [ApiMember(Name = "Entries", Description = "SmartMatch Entry", IsRequired = true, DataType = "string", ParameterType = "query", Verb = "POST")]
        public List<NameValuePair> Entries { get; set; }
    }

    [Route("/Library/AutoOrganizePlus/AbsoluteEpisodeMappings", "GET", Summary = "Gets absolute episode rules")]
    public class GetAbsoluteEpisodeMappings : IReturn<List<AbsoluteEpisodeMapping>>
    {
    }

    [Route("/Library/AutoOrganizePlus/AbsoluteEpisodeMappings", "POST", Summary = "Creates or updates an absolute episode rule")]
    public class SaveAbsoluteEpisodeMapping : AbsoluteEpisodeMapping, IReturn<AbsoluteEpisodeMapping>
    {
    }

    [Route("/Library/AutoOrganizePlus/AbsoluteEpisodeMappings/{Id}", "DELETE", Summary = "Deletes an absolute episode rule")]
    public class DeleteAbsoluteEpisodeMapping : IReturnVoid
    {
        [ApiMember(Name = "Id", Description = "Rule Id", IsRequired = true, DataType = "string", ParameterType = "path", Verb = "DELETE")]
        public string Id { get; set; }
    }

    [Authenticated(Roles = "Admin")]
    public class FileOrganizationService : IService, IRequiresRequest
    {
        private readonly IHttpResultFactory _resultFactory;

        public IRequest Request { get; set; }

        public FileOrganizationService(IHttpResultFactory resultFactory)
        {
            _resultFactory = resultFactory;
        }

        private IFileOrganizationService InternalFileOrganizationService
        {
            get { return PluginEntryPoint.Current.FileOrganizationService; }
        }

        public object Get(GetFileOrganizationActivity request)
        {
            var result = InternalFileOrganizationService.GetResults(new FileOrganizationResultQuery
            {
                Limit = request.Limit,
                StartIndex = request.StartIndex
            });

            return _resultFactory.GetResult(Request, result);
        }

        public void Delete(DeleteOriginalFile request)
        {
            InternalFileOrganizationService.DeleteOriginalFile(request.Id);

        }

        public void Delete(ClearOrganizationLog request)
        {
            InternalFileOrganizationService.ClearLog();

        }


        public void Delete(ClearOrganizationCompletedLog request)
        {
            InternalFileOrganizationService.ClearCompleted();

        }


        public void Post(PerformOrganization request)
        {
            // Don't await this
            var task = InternalFileOrganizationService.PerformOrganization(request.Id);

            // Async processing (close dialog early instead of waiting until the file has been copied)
            // Wait 2s for exceptions that may occur to have them forwarded to the client for immediate error display
            task.Wait(2000);
        }

        public void Post(OrganizeEpisode request)
        {
            var dicNewProviderIds = new ProviderIdDictionary();

            if (request.NewSeriesProviderIds != null)
            {
                dicNewProviderIds = request.NewSeriesProviderIds;
            }

            // Don't await this
            var task = InternalFileOrganizationService.PerformOrganization(new EpisodeFileOrganizationRequest
            {
                EndingEpisodeNumber = request.EndingEpisodeNumber,
                EpisodeNumber = request.EpisodeNumber,
                RememberCorrection = request.RememberCorrection,
                RememberAbsoluteMapping = request.RememberAbsoluteMapping,
                ResultId = request.Id,
                SeasonNumber = request.SeasonNumber,
                SeriesId = request.SeriesId,
                NewSeriesName = request.NewSeriesName,
                NewSeriesYear = request.NewSeriesYear,
                NewSeriesProviderIds = dicNewProviderIds,
                TargetFolder = request.TargetFolder
            });

            // Async processing (close dialog early instead of waiting until the file has been copied)
            // Wait 2s for exceptions that may occur to have them forwarded to the client for immediate error display
            task.Wait(2000);
        }

        public void Post(OrganizeMovie request)
        {
            var dicNewProviderIds = new ProviderIdDictionary();

            if (request.NewMovieProviderIds != null)
            {
                dicNewProviderIds = request.NewMovieProviderIds;
            }

            // Don't await this
            InternalFileOrganizationService.PerformOrganization(new MovieFileOrganizationRequest
            {
                ResultId = request.Id,
                MovieId = request.MovieId,
                NewMovieName = request.NewMovieName,
                NewMovieYear = request.NewMovieYear,
                NewMovieProviderIds = dicNewProviderIds,
                TargetFolder = request.TargetFolder
            });
        }

        public object Get(GetSmartMatchInfos request)
        {
            var result = InternalFileOrganizationService.GetSmartMatchInfos(new FileOrganizationResultQuery
            {
                Limit = request.Limit,
                StartIndex = request.StartIndex
            });

            return _resultFactory.GetResult(Request, result);
        }

        public void Post(DeleteSmartMatchEntry request)
        {
            foreach (var entry in request.Entries)
            {
                InternalFileOrganizationService.DeleteSmartMatchEntry(entry.Name, entry.Value);
            }
        }

        public object Get(GetAbsoluteEpisodeMappings request)
        {
            return _resultFactory.GetResult(Request, InternalFileOrganizationService.GetAbsoluteEpisodeMappings());
        }

        public object Post(SaveAbsoluteEpisodeMapping request)
        {
            var matchStrings = (request.MatchStrings ?? new List<string>())
                .Select(i => (i ?? string.Empty).Trim())
                .Where(i => i.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var ranges = (request.Ranges ?? new List<AbsoluteEpisodeRange>())
                .GroupBy(i => i.FromEpisode)
                .Select(i => i.Last())
                .OrderBy(i => i.FromEpisode)
                .ToList();

            if (string.IsNullOrEmpty(request.SeriesId) || matchStrings.Count == 0 || ranges.Count == 0)
            {
                throw new ArgumentException("A series, at least one file name and at least one range are required.");
            }

            if (ranges.Any(i => i.FromEpisode < 0 || i.SeasonNumber < 0 || i.StartAt < 0))
            {
                throw new ArgumentException("Range numbers can't be negative.");
            }

            var existing = InternalFileOrganizationService.GetAbsoluteEpisodeMappings();
            var clash = existing.FirstOrDefault(m => m.Id != request.Id && m.MatchStrings.Any(i => matchStrings.Contains(i, StringComparer.OrdinalIgnoreCase)));

            if (clash != null)
            {
                throw new ArgumentException(string.Format("A file name is already used by the rule for {0}.", clash.SeriesName));
            }

            var mapping = new AbsoluteEpisodeMapping
            {
                Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id,
                SeriesId = request.SeriesId,
                SeriesName = request.SeriesName,
                MatchStrings = matchStrings,
                Ranges = ranges
            };

            InternalFileOrganizationService.SaveAbsoluteEpisodeMapping(mapping, CancellationToken.None);

            return _resultFactory.GetResult(Request, mapping);
        }

        public void Delete(DeleteAbsoluteEpisodeMapping request)
        {
            InternalFileOrganizationService.DeleteAbsoluteEpisodeMapping(request.Id);
        }
    }
}
