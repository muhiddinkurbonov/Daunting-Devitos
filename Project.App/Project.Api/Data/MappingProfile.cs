using System.Net.Http.Headers;
using AutoMapper;
using Project.Api.Models;
using Project.Api.DTOs;

namespace Project.Api.Data
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {

            CreateMap<Hand, HandDTO>().ReverseMap();
            CreateMap<Hand, HandUpdateDTO>().ReverseMap();
            CreateMap<Hand, HandPatchDTO>().ReverseMap();

        }
    }
}
