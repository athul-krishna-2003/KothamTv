from django.shortcuts import render
from django.http import JsonResponse
import urllib.request
import json

OMDB_API_KEY = "bcc95c31"

def home(request):
    return render(request, "index.html")

def watch(request):
    return render(request, "watch.html")

def search_suggestions(request):
    """Returns search suggestions as user types"""
    query = request.GET.get("q", "").strip()
    media_type = request.GET.get("type", "movie")

    if not query or len(query) < 2:
        return JsonResponse({"results": []})

    try:
        url = f"http://www.omdbapi.com/?s={urllib.parse.quote(query)}&type={media_type}&apikey={OMDB_API_KEY}"
        with urllib.request.urlopen(url, timeout=5) as response:
            data = json.loads(response.read())

        if data.get("Response") == "True":
            results = [
                {
                    "title": item["Title"],
                    "year": item["Year"],
                    "poster": item["Poster"] if item["Poster"] != "N/A" else None,
                    "imdbID": item["imdbID"],
                }
                for item in data.get("Search", [])[:6]
            ]
            return JsonResponse({"results": results})
        else:
            return JsonResponse({"results": []})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def fetch_movie(request):
    """Fetches movie/series by title and returns imdbID + poster"""
    title = request.GET.get("title", "").strip()
    media_type = request.GET.get("type", "movie")

    if not title:
        return JsonResponse({"error": "No title provided"}, status=400)

    try:
        import urllib.parse
        url = f"http://www.omdbapi.com/?t={urllib.parse.quote(title)}&type={media_type}&apikey={OMDB_API_KEY}"
        with urllib.request.urlopen(url, timeout=5) as response:
            data = json.loads(response.read())

        if data.get("Response") == "True":
            return JsonResponse({
                "imdbID": data["imdbID"],
                "title": data["Title"],
                "year": data["Year"],
                "poster": data["Poster"] if data["Poster"] != "N/A" else None,
                "rating": data.get("imdbRating", "N/A"),
            })
        else:
            # Exact match failed — try fuzzy search for "did you mean?"
            try:
                search_url = f"http://www.omdbapi.com/?s={urllib.parse.quote(title)}&type={media_type}&apikey={OMDB_API_KEY}"
                with urllib.request.urlopen(search_url, timeout=5) as search_response:
                    search_data = json.loads(search_response.read())

                if search_data.get("Response") == "True":
                    suggestions = [
                        {
                            "title": item["Title"],
                            "year": item["Year"],
                            "poster": item["Poster"] if item["Poster"] != "N/A" else None,
                            "imdbID": item["imdbID"],
                        }
                        for item in search_data.get("Search", [])[:4]
                    ]
                    return JsonResponse({
                        "error": "Not found",
                        "suggestions": suggestions
                    }, status=404)
            except:
                pass

            return JsonResponse({"error": data.get("Error", "Not found")}, status=404)

    except Exception as e:
        return JsonResponse({"error": "Server error"}, status=500)