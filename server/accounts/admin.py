from django.contrib import admin

from .models import User


class UserAdmin(admin.ModelAdmin):
    list_per_page = 500
    list_display = (
        "email",
        "first_name",
        "last_name",
        "wallet_balance",
        "date_joined",
        "free_to_play",
    )
    list_editable = ("wallet_balance",)
    ordering = ('-date_joined',)


admin.site.register(User, UserAdmin)
