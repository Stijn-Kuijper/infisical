package api

import (
	"fmt"

	"github.com/go-resty/resty/v2"
)

const USER_AGENT_NAME = "k8-operator"

func CallGetEncryptedWorkspaceKey(httpClient *resty.Client, request GetEncryptedWorkspaceKeyRequest) (GetEncryptedWorkspaceKeyResponse, error) {
	endpoint := fmt.Sprintf("%v/v2/workspace/%v/encrypted-key", API_HOST_URL, request.WorkspaceId)
	var result GetEncryptedWorkspaceKeyResponse
	response, err := httpClient.
		R().
		SetResult(&result).
		SetHeader("User-Agent", USER_AGENT_NAME).
		Get(endpoint)

	if err != nil {
		return GetEncryptedWorkspaceKeyResponse{}, fmt.Errorf("CallGetEncryptedWorkspaceKey: Unable to complete api request [err=%s]", err)
	}

	if response.IsError() {
		return GetEncryptedWorkspaceKeyResponse{}, fmt.Errorf("CallGetEncryptedWorkspaceKey: Unsuccessful response: [response=%s]", response)
	}

	return result, nil
}

func CallGetServiceTokenDetailsV2(httpClient *resty.Client) (GetServiceTokenDetailsResponse, error) {
	var tokenDetailsResponse GetServiceTokenDetailsResponse
	response, err := httpClient.
		R().
		SetResult(&tokenDetailsResponse).
		SetHeader("User-Agent", USER_AGENT_NAME).
		Get(fmt.Sprintf("%v/v2/service-token", API_HOST_URL))

	if err != nil {
		return GetServiceTokenDetailsResponse{}, fmt.Errorf("CallGetServiceTokenDetails: Unable to complete api request [err=%s]", err)
	}

	if response.IsError() {
		return GetServiceTokenDetailsResponse{}, fmt.Errorf("CallGetServiceTokenDetails: Unsuccessful response: [response=%s]", response)
	}

	return tokenDetailsResponse, nil
}

func CallGetSecretsV2(httpClient *resty.Client, request GetEncryptedSecretsV2Request) (GetEncryptedSecretsV2Response, error) {
	var encryptedSecretsResponse GetEncryptedSecretsV2Response
	createHttpRequest := httpClient.
		R().
		SetQueryParam("environment", request.Environment).
		SetQueryParam("workspaceId", request.WorkspaceId).
		SetResult(&encryptedSecretsResponse).
		SetHeader("User-Agent", USER_AGENT_NAME)

	createHttpRequest.SetHeader("If-None-Match", request.ETag)

	response, err := createHttpRequest.Get(fmt.Sprintf("%v/v2/secrets", API_HOST_URL))

	if err != nil {
		return GetEncryptedSecretsV2Response{}, fmt.Errorf("CallGetSecretsV2: Unable to complete api request [err=%s]", err)
	}

	if response.IsError() {
		return GetEncryptedSecretsV2Response{}, fmt.Errorf("CallGetSecretsV2: Unsuccessful response: [response=%s]", response)
	}

	if response.StatusCode() == 304 {
		encryptedSecretsResponse.Modified = false
	} else {
		encryptedSecretsResponse.Modified = true
	}

	encryptedSecretsResponse.ETag = response.Header().Get("etag")

	return encryptedSecretsResponse, nil
}

func CallGetServiceTokenAccountDetailsV2(httpClient *resty.Client) (ServiceAccountDetailsResponse, error) {
	var serviceAccountDetailsResponse ServiceAccountDetailsResponse
	response, err := httpClient.
		R().
		SetResult(&serviceAccountDetailsResponse).
		SetHeader("User-Agent", USER_AGENT_NAME).
		Get(fmt.Sprintf("%v/v2/service-accounts/me", API_HOST_URL))

	if err != nil {
		return ServiceAccountDetailsResponse{}, fmt.Errorf("CallGetServiceTokenAccountDetailsV2: Unable to complete api request [err=%s]", err)
	}

	if response.IsError() {
		return ServiceAccountDetailsResponse{}, fmt.Errorf("CallGetServiceTokenAccountDetailsV2: Unsuccessful response: [response=%s]", response)
	}

	return serviceAccountDetailsResponse, nil
}

func CallGetServiceAccountWorkspacePermissionsV2(httpClient *resty.Client) (ServiceAccountWorkspacePermissions, error) {
	var serviceAccountWorkspacePermissionsResponse ServiceAccountWorkspacePermissions
	response, err := httpClient.
		R().
		SetResult(&serviceAccountWorkspacePermissionsResponse).
		SetHeader("User-Agent", USER_AGENT_NAME).
		Get(fmt.Sprintf("%v/v2/service-accounts/<service-account-id>/permissions/workspace", API_HOST_URL))

	if err != nil {
		return ServiceAccountWorkspacePermissions{}, fmt.Errorf("CallGetServiceAccountWorkspacePermissionsV2: Unable to complete api request [err=%s]", err)
	}

	if response.IsError() {
		return ServiceAccountWorkspacePermissions{}, fmt.Errorf("CallGetServiceAccountWorkspacePermissionsV2: Unsuccessful response: [response=%s]", response)
	}

	return serviceAccountWorkspacePermissionsResponse, nil
}

func CallGetServiceAccountKeysV2(httpClient *resty.Client, request GetServiceAccountKeysRequest) (GetServiceAccountKeysResponse, error) {
	var serviceAccountKeysResponse GetServiceAccountKeysResponse
	response, err := httpClient.
		R().
		SetResult(&serviceAccountKeysResponse).
		SetHeader("User-Agent", USER_AGENT_NAME).
		Get(fmt.Sprintf("%v/v2/service-accounts/%v/keys", API_HOST_URL, request.ServiceAccountId))

	if err != nil {
		return GetServiceAccountKeysResponse{}, fmt.Errorf("CallGetServiceAccountKeysV2: Unable to complete api request [err=%s]", err)
	}

	if response.IsError() {
		return GetServiceAccountKeysResponse{}, fmt.Errorf("CallGetServiceAccountKeysV2: Unsuccessful response: [response=%s]", response)
	}

	return serviceAccountKeysResponse, nil
}
