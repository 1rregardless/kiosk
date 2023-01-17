:: just run this file from this folder with no arguments to build the release binary
:: - creates or updates pnacl/Release
:: - does not update this folder; to do so:
:: - copy pnacl/Release/ldb_assist.nmf -> ./ldb_assist.nmf
:: - copy pnacl/Release/ldb_assist.pexe -> ./ldb_assist.pexe
@echo off
set NACL_SDK_ROOT=E:\nacl_sdk\pepper_49
set TOOLCHAIN=pnacl
set CONFIG=Release
%NACL_SDK_ROOT%\tools\make.exe %*
