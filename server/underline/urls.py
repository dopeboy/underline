from django.conf import settings
from django.contrib import admin
from django.urls import path, re_path, include
from django.views.decorators.csrf import csrf_exempt


from .views import FrontendAppView, GraphQLView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("core/", include("core.urls")),
    path("graphql/", csrf_exempt(GraphQLView.as_view(graphiql=settings.GRAPHQL_DEBUG))),
    path("gql", csrf_exempt(GraphQLView.as_view())),
    re_path(r".*", FrontendAppView.as_view()),
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]


admin.site.enable_nav_sidebar = False
