from django.contrib import admin
from django.urls import path
from myapp import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path("", views.home, name="home"),
    path("watch/", views.watch, name="watch"),
    path("api/search/", views.search_suggestions, name="search_suggestions"),
    path("api/fetch/", views.fetch_movie, name="fetch_movie"),
]